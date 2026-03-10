import type { EngagementType } from '../types/database';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface EngagementRecord {
  user_id: string;
  tweet_id: string;
  engagement_type: EngagementType;
  created_at: Date;
}

export interface TweetCounters {
  tweet_id: string;
  like_count: number;
  reply_count: number;
  repost_count: number;
  click_count: number;
}

export interface EngagementResult {
  engagements: EngagementRecord[];
  tweetCounters: Map<string, TweetCounters>;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

interface TweetInput {
  id: string;
  author_id: string;
  topic: string;
  created_at: Date;
}

interface UserInput {
  id: string;
  persona_type: string;
  interests: string[];
  follower_tier: string;
  engagement_rate: number;
}

interface FollowInput {
  follower_id: string;
  following_id: string;
}

export interface SimulateEngagementsParams {
  tweets: TweetInput[];
  users: UserInput[];
  follows: FollowInput[];
  viewerId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Engagement type probability weights — must sum to ~1.0 */
const ENGAGEMENT_TYPE_WEIGHTS: Record<EngagementType, number> = {
  like: 0.60,
  click: 0.20,
  reply: 0.10,
  repost: 0.05,
  follow_author: 0.03,
  not_interested: 0.02,
};

/** Multiplier for base engagement count by follower tier */
const TIER_MULTIPLIERS: Record<string, number> = {
  mega: 10.0,
  macro: 4.0,
  mid: 1.5,
  micro: 1.0,
};

/** Topics that get a popularity boost */
const TRENDING_TOPICS = new Set([
  'ai', 'crypto', 'markets', 'startups', 'tech', 'politics',
]);

/** Viewer preferred topics (tech/AI-heavy for affinity scoring) */
const VIEWER_PREFERRED_TOPICS = new Set([
  'ai', 'tech', 'startups', 'open_source', 'crypto',
]);

/** Viewer preferred persona types */
const VIEWER_PREFERRED_PERSONAS = new Set([
  'founder', 'tech',
]);

// ─── Power Law Distribution ──────────────────────────────────────────────────

/**
 * Generates a power-law distributed integer.
 * Uses inverse transform: X = floor(U^(-1/alpha) - 1) clamped to [0, max].
 * alpha controls the tail heaviness — lower alpha = heavier tail.
 *
 * Distribution shape:
 *   - Most values: 0-10 (the bulk)
 *   - Some values: 10-100 (popular)
 *   - Rare values: 100-1000+ (viral)
 */
function powerLawSample(alpha: number, maxValue: number): number {
  // Avoid exact 0 to prevent infinity
  const u = Math.max(Math.random(), 1e-10);
  const raw = Math.floor(Math.pow(u, -1 / alpha) - 1);
  return Math.min(Math.max(raw, 0), maxValue);
}

// ─── Engagement Count Calculation ────────────────────────────────────────────

/**
 * Computes the total number of engagements a tweet should receive.
 * Factors: author tier, topic popularity, time recency, viral chance.
 */
function computeTweetEngagementCount(
  tweet: TweetInput,
  authorTier: string,
  nowMs: number,
): number {
  // Base power-law sample: alpha=1.5 gives heavy tail
  // Most tweets 0-10, some 10-100, rare 100+
  let base = powerLawSample(1.5, 2000);

  // Scale by author's follower tier
  const tierMult = TIER_MULTIPLIERS[authorTier] ?? 1.0;
  base = Math.round(base * tierMult);

  // Topic popularity boost: trending topics get 1.5x
  if (TRENDING_TOPICS.has(tweet.topic)) {
    base = Math.round(base * 1.5);
  }

  // Time decay: newer tweets get more engagement
  // Tweets from today get 1.0x, tweets from 30 days ago get 0.3x
  const ageMs = nowMs - tweet.created_at.getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  const recencyFactor = Math.max(0.3, 1.0 - ageDays * 0.023); // ~0.3 at 30 days
  base = Math.round(base * recencyFactor);

  // Random viral factor: 1% chance any tweet goes viral regardless of author
  if (Math.random() < 0.01) {
    base = Math.max(base, 500 + Math.floor(Math.random() * 1500));
  }

  return Math.max(base, 0);
}

// ─── User Selection for Engagements ──────────────────────────────────────────

/**
 * Selects which users will engage with a tweet and what type of engagement.
 * Considers: follow relationship, homophily, engagement_rate.
 */
function selectEngagingUsers(
  tweet: TweetInput,
  targetCount: number,
  users: UserInput[],
  followersOfAuthor: Set<string>,
  _usersByPersonaType: Map<string, UserInput[]>,
  authorPersonaType: string,
): Array<{ userId: string; engagementType: EngagementType }> {
  if (targetCount === 0 || users.length === 0) return [];

  const results: Array<{ userId: string; engagementType: EngagementType }> = [];
  const engaged = new Set<string>();

  engaged.add(tweet.author_id);

  const candidates: Array<{ user: UserInput; weight: number }> = [];

  for (const user of users) {
    if (user.id === tweet.author_id) continue;

    let weight = user.engagement_rate;

    // Follow relationship: 3x more likely to engage
    if (followersOfAuthor.has(user.id)) {
      weight *= 3.0;
    }

    // Homophily: same persona_type → 2x engagement
    if (user.persona_type === authorPersonaType) {
      weight *= 2.0;
    }

    // Shared interest boost: if user's interests include the tweet topic, 1.5x
    if (user.interests.includes(tweet.topic)) {
      weight *= 1.5;
    }

    candidates.push({ user, weight });
  }

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return [];

  const sampleSize = Math.min(targetCount, candidates.length);
  const remaining = [...candidates];
  for (let i = 0; i < sampleSize && remaining.length > 0; i++) {
    const total = remaining.reduce((s, c) => s + c.weight, 0);
    if (total === 0) break;

    let r = Math.random() * total;
    let chosenIdx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].weight;
      if (r <= 0) {
        chosenIdx = j;
        break;
      }
    }

    const chosen = remaining[chosenIdx];
    if (!engaged.has(chosen.user.id)) {
      engaged.add(chosen.user.id);
      const engagementType = pickEngagementType();
      results.push({ userId: chosen.user.id, engagementType });
    }
    remaining.splice(chosenIdx, 1);
  }

  return results;
}

/**
 * Picks an engagement type based on the distribution weights.
 * likes: ~60%, clicks: ~20%, replies: ~10%, reposts: ~5%,
 * follow_author: ~3%, not_interested: ~2%
 */
function pickEngagementType(): EngagementType {
  const r = Math.random();
  let cumulative = 0;
  const entries = Object.entries(ENGAGEMENT_TYPE_WEIGHTS) as Array<[EngagementType, number]>;
  for (const [type, weight] of entries) {
    cumulative += weight;
    if (r <= cumulative) return type;
  }
  return 'like'; // fallback
}

/**
 * Generates a random timestamp after the tweet's created_at but before now.
 */
function randomEngagementTime(tweetCreatedAt: Date, nowMs: number): Date {
  const tweetMs = tweetCreatedAt.getTime();
  const delta = nowMs - tweetMs;
  if (delta <= 0) return new Date(tweetMs + 1000);
  return new Date(tweetMs + Math.random() * delta);
}

// ─── Viewer Engagement Generation ────────────────────────────────────────────

/**
 * Generates viewer-specific engagements to ensure the viewer has a rich
 * engagement history for affinity scoring.
 * Target: ~500-1000 total engagements with clear preferences.
 */
function generateViewerEngagements(
  tweets: TweetInput[],
  viewerId: string,
  usersById: Map<string, UserInput>,
  viewerFollows: Set<string>,
  nowMs: number,
): EngagementRecord[] {
  const viewerEngagements: EngagementRecord[] = [];
  const engagedTweets = new Set<string>();

  const targetViewerEngagements = 500 + Math.floor(Math.random() * 500);

  const preferredTweets: TweetInput[] = [];
  const otherTweets: TweetInput[] = [];

  for (const tweet of tweets) {
    if (tweet.author_id === viewerId) continue;

    const author = usersById.get(tweet.author_id);
    const isPreferredTopic = VIEWER_PREFERRED_TOPICS.has(tweet.topic);
    const isPreferredAuthor = author && VIEWER_PREFERRED_PERSONAS.has(author.persona_type);
    const isFollowed = viewerFollows.has(tweet.author_id);

    if (isPreferredTopic || isPreferredAuthor || isFollowed) {
      preferredTweets.push(tweet);
    } else {
      otherTweets.push(tweet);
    }
  }

  const preferredCount = Math.floor(targetViewerEngagements * 0.7);

  const shuffledPreferred = [...preferredTweets].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherTweets].sort(() => Math.random() - 0.5);

  let count = 0;

  for (const tweet of shuffledPreferred) {
    if (count >= preferredCount) break;
    if (engagedTweets.has(tweet.id)) continue;
    engagedTweets.add(tweet.id);

    const r = Math.random();
    let engagementType: EngagementType;
    if (r < 0.55) engagementType = 'like';
    else if (r < 0.75) engagementType = 'click';
    else if (r < 0.87) engagementType = 'reply';
    else if (r < 0.94) engagementType = 'repost';
    else if (r < 0.99) engagementType = 'follow_author';
    else engagementType = 'not_interested';

    viewerEngagements.push({
      user_id: viewerId,
      tweet_id: tweet.id,
      engagement_type: engagementType,
      created_at: randomEngagementTime(tweet.created_at, nowMs),
    });
    count++;
  }

  for (const tweet of shuffledOther) {
    if (count >= targetViewerEngagements) break;
    if (engagedTweets.has(tweet.id)) continue;
    engagedTweets.add(tweet.id);

    const r = Math.random();
    let engagementType: EngagementType;
    if (r < 0.40) engagementType = 'like';
    else if (r < 0.65) engagementType = 'click';
    else if (r < 0.75) engagementType = 'reply';
    else if (r < 0.80) engagementType = 'repost';
    else if (r < 0.92) engagementType = 'not_interested';
    else engagementType = 'follow_author';

    viewerEngagements.push({
      user_id: viewerId,
      tweet_id: tweet.id,
      engagement_type: engagementType,
      created_at: randomEngagementTime(tweet.created_at, nowMs),
    });
    count++;
  }

  return viewerEngagements;
}

// ─── Main Function ────────────────────────────────────────────────────────────

export function simulateEngagements(params: SimulateEngagementsParams): EngagementResult {
  const { tweets, users, follows, viewerId } = params;
  const nowMs = Date.now();

  const usersById = new Map<string, UserInput>();
  for (const user of users) {
    usersById.set(user.id, user);
  }

  const usersByPersonaType = new Map<string, UserInput[]>();
  for (const user of users) {
    const list = usersByPersonaType.get(user.persona_type) ?? [];
    list.push(user);
    usersByPersonaType.set(user.persona_type, list);
  }

  const followersOf = new Map<string, Set<string>>();
  const followingOf = new Map<string, Set<string>>();
  for (const f of follows) {
    if (!followersOf.has(f.following_id)) followersOf.set(f.following_id, new Set());
    followersOf.get(f.following_id)!.add(f.follower_id);
    if (!followingOf.has(f.follower_id)) followingOf.set(f.follower_id, new Set());
    followingOf.get(f.follower_id)!.add(f.following_id);
  }

  const viewerFollows = followingOf.get(viewerId) ?? new Set<string>();

  const engagementSet = new Set<string>();
  const allEngagements: EngagementRecord[] = [];

  const tweetCounters = new Map<string, TweetCounters>();
  for (const tweet of tweets) {
    tweetCounters.set(tweet.id, {
      tweet_id: tweet.id,
      like_count: 0,
      reply_count: 0,
      repost_count: 0,
      click_count: 0,
    });
  }

  function addEngagement(record: EngagementRecord): boolean {
    const key = `${record.user_id}:${record.tweet_id}:${record.engagement_type}`;
    if (engagementSet.has(key)) return false;
    engagementSet.add(key);
    allEngagements.push(record);

    const counters = tweetCounters.get(record.tweet_id);
    if (counters) {
      switch (record.engagement_type) {
        case 'like':
          counters.like_count++;
          break;
        case 'reply':
          counters.reply_count++;
          break;
        case 'repost':
          counters.repost_count++;
          break;
        case 'click':
          counters.click_count++;
          break;

      }
    }
    return true;
  }

  // ── Phase 1: Generate organic engagements per tweet ──────────────────────
  for (const tweet of tweets) {
    const author = usersById.get(tweet.author_id);
    const authorTier = author?.follower_tier ?? 'micro';
    const authorPersonaType = author?.persona_type ?? 'tech';

    const targetEngagements = computeTweetEngagementCount(tweet, authorTier, nowMs);

    if (targetEngagements === 0) continue;

    const authorFollowers = followersOf.get(tweet.author_id) ?? new Set<string>();

    const engaged = selectEngagingUsers(
      tweet,
      targetEngagements,
      users,
      authorFollowers,
      usersByPersonaType,
      authorPersonaType,
    );

    for (const { userId, engagementType } of engaged) {
      addEngagement({
        user_id: userId,
        tweet_id: tweet.id,
        engagement_type: engagementType,
        created_at: randomEngagementTime(tweet.created_at, nowMs),
      });
    }
  }

  // ── Phase 2: Viewer-specific engagements ─────────────────────────────────
  const viewerEngagements = generateViewerEngagements(
    tweets,
    viewerId,
    usersById,
    viewerFollows,
    nowMs,
  );

  for (const record of viewerEngagements) {
    addEngagement(record);
  }

  const totalEngagements = allEngagements.length;
  const tweetCount = tweets.length;
  console.log(
    `[SEED] Engagement simulation: ${totalEngagements} engagements across ${tweetCount} tweets`,
  );

  const viewerCount = allEngagements.filter((e) => e.user_id === viewerId).length;
  console.log(`[SEED] Viewer has ${viewerCount} engagements`);

  return {
    engagements: allEngagements,
    tweetCounters,
  };
}

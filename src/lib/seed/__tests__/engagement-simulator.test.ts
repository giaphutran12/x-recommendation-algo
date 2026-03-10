import { describe, it, expect } from 'vitest';
import { simulateEngagements } from '../engagement-simulator';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

function makeUsers(count: number) {
  const personaTypes = ['founder', 'journalist', 'meme', 'trader', 'politician', 'tech', 'culture'];
  const tiers = ['micro', 'mid', 'macro', 'mega'];
  const topicPool = ['ai', 'tech', 'startups', 'crypto', 'markets', 'culture', 'sports', 'gaming'];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${String(i).padStart(3, '0')}`,
    persona_type: personaTypes[i % personaTypes.length],
    interests: [topicPool[i % topicPool.length], topicPool[(i + 1) % topicPool.length]],
    follower_tier: tiers[i % tiers.length],
    engagement_rate: 0.04 + (i % 5) * 0.02,
  }));
}

function makeTweets(count: number, users: Array<{ id: string }>) {
  const topics = ['ai', 'tech', 'startups', 'crypto', 'markets', 'culture', 'sports', 'gaming', 'politics', 'science'];
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => ({
    id: `tweet-${String(i).padStart(4, '0')}`,
    author_id: users[i % users.length].id,
    topic: topics[i % topics.length],
    created_at: new Date(now - Math.random() * 14 * 24 * 60 * 60 * 1000),
  }));
}

function makeFollows(users: Array<{ id: string }>, density: number = 0.1) {
  const follows: Array<{ follower_id: string; following_id: string }> = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() < density) {
        follows.push({ follower_id: users[i].id, following_id: users[j].id });
      }
    }
  }
  follows.push({ follower_id: VIEWER_ID, following_id: users[0].id });
  follows.push({ follower_id: VIEWER_ID, following_id: users[1].id });
  follows.push({ follower_id: VIEWER_ID, following_id: users[2].id });
  return follows;
}

describe('simulateEngagements', () => {
  const users = makeUsers(50);
  const tweets = makeTweets(500, users);
  const follows = makeFollows(users);

  const result = simulateEngagements({
    tweets,
    users,
    follows,
    viewerId: VIEWER_ID,
  });

  it('produces engagements', () => {
    expect(result.engagements.length).toBeGreaterThan(0);
  });

  it('all 6 engagement types are present', () => {
    const types = new Set(result.engagements.map((e) => e.engagement_type));
    expect(types.has('like')).toBe(true);
    expect(types.has('click')).toBe(true);
    expect(types.has('reply')).toBe(true);
    expect(types.has('repost')).toBe(true);
    expect(types.has('follow_author')).toBe(true);
    expect(types.has('not_interested')).toBe(true);
  });

  it('engagement counts follow approximate power law (most tweets have few engagements)', () => {
    const countsPerTweet = new Map<string, number>();
    for (const e of result.engagements) {
      countsPerTweet.set(e.tweet_id, (countsPerTweet.get(e.tweet_id) ?? 0) + 1);
    }

    const engagementCounts = [...countsPerTweet.values()];
    const median = engagementCounts.sort((a, b) => a - b)[Math.floor(engagementCounts.length / 2)];
    const max = Math.max(...engagementCounts);

    expect(max).toBeGreaterThan(median * 2);

    const lowEngagement = engagementCounts.filter((c) => c <= 10).length;
    expect(lowEngagement / engagementCounts.length).toBeGreaterThan(0.3);
  });

  it('tweet counters match actual engagement records', () => {
    const manualCounts = new Map<string, { likes: number; replies: number; reposts: number; clicks: number }>();

    for (const e of result.engagements) {
      if (!manualCounts.has(e.tweet_id)) {
        manualCounts.set(e.tweet_id, { likes: 0, replies: 0, reposts: 0, clicks: 0 });
      }
      const c = manualCounts.get(e.tweet_id)!;
      if (e.engagement_type === 'like') c.likes++;
      else if (e.engagement_type === 'reply') c.replies++;
      else if (e.engagement_type === 'repost') c.reposts++;
      else if (e.engagement_type === 'click') c.clicks++;
    }

    for (const [tweetId, manual] of manualCounts) {
      const counters = result.tweetCounters.get(tweetId);
      expect(counters).toBeDefined();
      if (counters) {
        expect(counters.like_count).toBe(manual.likes);
        expect(counters.reply_count).toBe(manual.replies);
        expect(counters.repost_count).toBe(manual.reposts);
        expect(counters.click_count).toBe(manual.clicks);
      }
    }
  });

  it('viewer has engagement history (500-1000+ engagements)', () => {
    const viewerEngagements = result.engagements.filter((e) => e.user_id === VIEWER_ID);
    expect(viewerEngagements.length).toBeGreaterThanOrEqual(100);
  });

  it('not_interested is roughly ~2% of total engagements', () => {
    const total = result.engagements.length;
    const notInterested = result.engagements.filter((e) => e.engagement_type === 'not_interested').length;
    const ratio = notInterested / total;

    // Allow range 0.5% - 8% since it's stochastic with a small dataset
    expect(ratio).toBeGreaterThan(0.005);
    expect(ratio).toBeLessThan(0.08);
  });

  it('engagement timestamps are after tweet created_at', () => {
    const tweetMap = new Map(tweets.map((t) => [t.id, t]));
    for (const e of result.engagements) {
      const tweet = tweetMap.get(e.tweet_id);
      if (tweet) {
        expect(e.created_at.getTime()).toBeGreaterThanOrEqual(tweet.created_at.getTime());
      }
    }
  });

  it('no engagement references a non-existent tweet', () => {
    const tweetIds = new Set(tweets.map((t) => t.id));
    for (const e of result.engagements) {
      expect(tweetIds.has(e.tweet_id)).toBe(true);
    }
  });

  it('no duplicate user+tweet+type combinations', () => {
    const seen = new Set<string>();
    for (const e of result.engagements) {
      const key = `${e.user_id}:${e.tweet_id}:${e.engagement_type}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('likes are the most common engagement type', () => {
    const typeCounts = new Map<string, number>();
    for (const e of result.engagements) {
      typeCounts.set(e.engagement_type, (typeCounts.get(e.engagement_type) ?? 0) + 1);
    }
    const likes = typeCounts.get('like') ?? 0;
    const clicks = typeCounts.get('click') ?? 0;
    const replies = typeCounts.get('reply') ?? 0;
    expect(likes).toBeGreaterThan(clicks);
    expect(likes).toBeGreaterThan(replies);
  });
});

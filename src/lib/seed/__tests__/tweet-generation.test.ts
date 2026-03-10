import { describe, it, expect } from 'vitest';
import { loadGeneratedTweets } from '../load-generated-tweets';
import { personas } from '../personas';

const VALID_TWEET_TYPES = new Set(['original', 'reply', 'quote', 'repost']);
const VALID_TOPIC_IDS = new Set([
  'ai', 'startups', 'crypto', 'markets', 'politics', 'tech', 'culture',
  'sports', 'gaming', 'science', 'climate', 'media', 'health', 'finance',
  'open_source', 'web3', 'education', 'food', 'travel', 'vc_investing',
  'design', 'philosophy', 'biotech', 'space', 'social_commentary',
]);

describe('loadGeneratedTweets', () => {
  const tweets = loadGeneratedTweets();

  it('loads at least 45,000 tweets', () => {
    expect(tweets.length).toBeGreaterThanOrEqual(45_000);
  });

  it('all tweet_type values are valid', () => {
    for (const tweet of tweets) {
      expect(VALID_TWEET_TYPES.has(tweet.tweet_type)).toBe(true);
    }
  });

  it('all topic values are valid topic ids', () => {
    for (const tweet of tweets) {
      expect(VALID_TOPIC_IDS.has(tweet.topic), `Invalid topic: ${tweet.topic}`).toBe(true);
    }
  });

  it('no tweet content exceeds 280 characters', () => {
    const oversized = tweets.filter((t) => t.content.length > 280);
    expect(oversized.length).toBe(0);
  });

  it('all tweets have non-empty content', () => {
    const empty = tweets.filter((t) => !t.content || t.content.trim().length === 0);
    expect(empty.length).toBe(0);
  });

  it('tweet type distribution is roughly correct', () => {
    const counts = { original: 0, reply: 0, quote: 0, repost: 0 };
    for (const t of tweets) counts[t.tweet_type]++;
    const total = tweets.length;

    const originalPct = counts.original / total;
    const replyPct = counts.reply / total;
    const quotePct = counts.quote / total;
    const repostPct = counts.repost / total;

    expect(originalPct).toBeGreaterThan(0.60);
    expect(originalPct).toBeLessThan(0.80);
    expect(replyPct).toBeGreaterThan(0.08);
    expect(replyPct).toBeLessThan(0.25);
    expect(quotePct).toBeGreaterThan(0.05);
    expect(quotePct).toBeLessThan(0.20);
    expect(repostPct).toBeGreaterThan(0.02);
    expect(repostPct).toBeLessThan(0.10);
  });

  it('all 200 persona usernames are represented', () => {
    const tweetUsernames = new Set(tweets.map((t) => t.persona_username));
    const personaUsernames = personas.map((p) => p.username);
    for (const username of personaUsernames) {
      expect(tweetUsernames.has(username), `Missing username: ${username}`).toBe(true);
    }
  });

  it('each persona has approximately 250 tweets', () => {
    const countsPerPersona: Record<string, number> = {};
    for (const tweet of tweets) {
      countsPerPersona[tweet.persona_username] = (countsPerPersona[tweet.persona_username] ?? 0) + 1;
    }
    for (const [username, count] of Object.entries(countsPerPersona)) {
      expect(count, `${username} has unexpected tweet count: ${count}`).toBeGreaterThanOrEqual(200);
      expect(count, `${username} has unexpected tweet count: ${count}`).toBeLessThanOrEqual(300);
    }
  });

  it('replies and quotes have parent_ref set', () => {
    const repliesWithoutParent = tweets.filter(
      (t) => (t.tweet_type === 'reply' || t.tweet_type === 'quote') && !t.parent_ref,
    );
    expect(repliesWithoutParent.length).toBe(0);
  });

  it('created_at_offset_hours is within 0-168 hours', () => {
    const outOfRange = tweets.filter(
      (t) => t.created_at_offset_hours < 0 || t.created_at_offset_hours > 168,
    );
    expect(outOfRange.length).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { Tweet, User } from '@/lib/types/database';
import {
  DropDuplicatesFilter,
  CoreDataHydrationFilter,
  SelfTweetFilter,
  PreviouslySeenFilter,
  PreviouslyServedFilter,
  BlockedAuthorFilter,
  MutedKeywordFilter,
  AgeFilter,
  RepostDedupFilter,
  ConversationDedupFilter,
  createFilterChain,
} from '@/lib/ranking/filters';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    display_name: 'Test User',
    bio: 'test bio',
    avatar_url: 'https://example.com/avatar.png',
    persona_type: 'tech',
    interests: ['tech'],
    writing_style: 'casual',
    follower_count: 1000,
    following_count: 100,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeTweet(overrides: Partial<Tweet> = {}): Tweet {
  return {
    id: `tweet-${Math.random().toString(36).slice(2, 8)}`,
    author_id: 'user-1',
    content: 'This is a test tweet',
    tweet_type: 'original',
    parent_tweet_id: null,
    quoted_tweet_id: null,
    topic: 'tech',
    embedding: null,
    like_count: 10,
    reply_count: 5,
    repost_count: 2,
    click_count: 50,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeCandidate(
  tweetOverrides: Partial<Tweet> = {},
  authorOverrides: Partial<User> = {},
): ScoredCandidate {
  const author = makeUser(authorOverrides);
  return {
    tweet: makeTweet({ author_id: author.id, ...tweetOverrides }),
    author,
    score: 0,
    in_network: true,
    engagement_predictions: null,
    explanation: null,
  };
}

function makeQuery(overrides: Partial<FeedQuery> = {}): FeedQuery {
  return {
    viewer_id: 'viewer-1',
    seen_ids: [],
    served_ids: [],
    algorithm_weights: {
      user_id: 'viewer-1',
      recency_weight: 1,
      popularity_weight: 1,
      network_weight: 1,
      topic_relevance_weight: 1,
      engagement_type_weights: {
        like: 1,
        reply: 1,
        repost: 1,
        click: 1,
        follow_author: 1,
        not_interested: -1,
      },
      updated_at: new Date().toISOString(),
    },
    limit: 50,
    ...overrides,
  };
}

describe('DropDuplicatesFilter', () => {
  const filter = new DropDuplicatesFilter();

  it('removes duplicate tweet IDs keeping first occurrence', () => {
    const candidates = [
      makeCandidate({ id: 'tweet-1' }),
      makeCandidate({ id: 'tweet-2' }),
      makeCandidate({ id: 'tweet-1' }),
    ];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.tweet.id)).toEqual(['tweet-1', 'tweet-2']);
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('CoreDataHydrationFilter', () => {
  const filter = new CoreDataHydrationFilter();

  it('removes candidates with missing content', () => {
    const candidates = [
      makeCandidate({ content: '' }),
      makeCandidate({ content: 'valid content' }),
    ];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.content).toBe('valid content');
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('AgeFilter', () => {
  const oneHourMs = 60 * 60 * 1000;
  const filter = new AgeFilter(2 * oneHourMs);

  it('removes tweets older than threshold', () => {
    const fresh = makeCandidate({ created_at: new Date().toISOString() });
    const old = makeCandidate({
      created_at: new Date(Date.now() - 3 * oneHourMs).toISOString(),
    });
    const result = filter.filter(makeQuery(), [fresh, old]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(fresh);
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('SelfTweetFilter', () => {
  const filter = new SelfTweetFilter();

  it('removes tweets authored by the viewer', () => {
    const selfTweet = makeCandidate(
      { author_id: 'viewer-1' },
      { id: 'viewer-1' },
    );
    const otherTweet = makeCandidate(
      { author_id: 'other-user' },
      { id: 'other-user' },
    );
    const result = filter.filter(makeQuery(), [selfTweet, otherTweet]);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.author_id).toBe('other-user');
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('RepostDedupFilter', () => {
  const filter = new RepostDedupFilter();

  it('keeps repost from author with highest follower count', () => {
    const repost1 = makeCandidate(
      { id: 'r1', tweet_type: 'repost', quoted_tweet_id: 'original-1' },
      { id: 'author-a', follower_count: 500 },
    );
    const repost2 = makeCandidate(
      { id: 'r2', tweet_type: 'repost', quoted_tweet_id: 'original-1' },
      { id: 'author-b', follower_count: 5000 },
    );
    const result = filter.filter(makeQuery(), [repost1, repost2]);
    expect(result).toHaveLength(1);
    expect(result[0].author.follower_count).toBe(5000);
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('PreviouslySeenFilter', () => {
  const filter = new PreviouslySeenFilter();

  it('removes tweets in seen_ids', () => {
    const candidates = [
      makeCandidate({ id: 'seen-1' }),
      makeCandidate({ id: 'fresh-1' }),
    ];
    const query = makeQuery({ seen_ids: ['seen-1'] });
    const result = filter.filter(query, candidates);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.id).toBe('fresh-1');
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('PreviouslyServedFilter', () => {
  const filter = new PreviouslyServedFilter();

  it('removes tweets in served_ids', () => {
    const candidates = [
      makeCandidate({ id: 'served-1' }),
      makeCandidate({ id: 'new-1' }),
    ];
    const query = makeQuery({ served_ids: ['served-1'] });
    const result = filter.filter(query, candidates);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.id).toBe('new-1');
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('MutedKeywordFilter', () => {
  it('removes tweets containing muted keywords', () => {
    const filter = new MutedKeywordFilter(['spam', 'crypto']);
    const candidates = [
      makeCandidate({ content: 'Buy CRYPTO now!' }),
      makeCandidate({ content: 'Normal tweet about tech' }),
    ];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.content).toBe('Normal tweet about tech');
  });

  it('passes all through with empty keyword list', () => {
    const filter = new MutedKeywordFilter();
    const candidates = [makeCandidate(), makeCandidate()];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    const filter = new MutedKeywordFilter(['spam']);
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('BlockedAuthorFilter', () => {
  it('removes tweets from blocked authors', () => {
    const filter = new BlockedAuthorFilter(['blocked-user']);
    const candidates = [
      makeCandidate({ author_id: 'blocked-user' }, { id: 'blocked-user' }),
      makeCandidate({ author_id: 'ok-user' }, { id: 'ok-user' }),
    ];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(1);
    expect(result[0].tweet.author_id).toBe('ok-user');
  });

  it('passes all through with empty blocked list', () => {
    const filter = new BlockedAuthorFilter();
    const candidates = [makeCandidate(), makeCandidate()];
    const result = filter.filter(makeQuery(), candidates);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    const filter = new BlockedAuthorFilter(['blocked']);
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('ConversationDedupFilter', () => {
  const filter = new ConversationDedupFilter();

  it('keeps most engaging tweet per conversation thread', () => {
    const low = makeCandidate({
      id: 'conv-1',
      parent_tweet_id: 'parent-1',
      like_count: 2,
      reply_count: 1,
    });
    const high = makeCandidate({
      id: 'conv-2',
      parent_tweet_id: 'parent-1',
      like_count: 100,
      reply_count: 50,
    });
    const standalone = makeCandidate({ id: 'standalone-1' });
    const result = filter.filter(makeQuery(), [low, high, standalone]);
    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.tweet.id);
    expect(ids).toContain('standalone-1');
    expect(ids).toContain('conv-2');
  });

  it('returns empty array for empty input', () => {
    expect(filter.filter(makeQuery(), [])).toEqual([]);
  });
});

describe('createFilterChain', () => {
  it('returns 10 filters in correct order', () => {
    const chain = createFilterChain();
    expect(chain).toHaveLength(10);
    expect(chain.map((f) => f.name)).toEqual([
      'DropDuplicatesFilter',
      'CoreDataHydrationFilter',
      'SelfTweetFilter',
      'PreviouslySeenFilter',
      'PreviouslyServedFilter',
      'BlockedAuthorFilter',
      'MutedKeywordFilter',
      'AgeFilter',
      'RepostDedupFilter',
      'ConversationDedupFilter',
    ]);
  });

  it('runs full chain removing expected candidates from mixed set', () => {
    const chain = createFilterChain({
      maxAgeMsOverride: 24 * 60 * 60 * 1000,
    });
    const query = makeQuery({
      viewer_id: 'viewer-1',
      seen_ids: ['seen-tweet-1', 'seen-tweet-2'],
      served_ids: [],
    });

    const now = new Date();
    const twoDaysAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);

    const candidates: ScoredCandidate[] = [
      // Normal tweets (should survive)
      ...Array.from({ length: 15 }, (_, i) =>
        makeCandidate(
          { id: `normal-${i}`, created_at: now.toISOString() },
          { id: `author-${i}` },
        ),
      ),
      // Duplicate of normal-0
      makeCandidate(
        { id: 'normal-0', created_at: now.toISOString() },
        { id: 'author-0' },
      ),
      // Another duplicate
      makeCandidate(
        { id: 'normal-1', created_at: now.toISOString() },
        { id: 'author-1' },
      ),
      // Old tweet
      makeCandidate(
        { id: 'old-tweet', created_at: twoDaysAgo.toISOString() },
        { id: 'author-old' },
      ),
      // Self tweet
      makeCandidate(
        { id: 'self-tweet', author_id: 'viewer-1', created_at: now.toISOString() },
        { id: 'viewer-1' },
      ),
      // Previously seen tweets
      makeCandidate(
        { id: 'seen-tweet-1', created_at: now.toISOString() },
        { id: 'author-seen-1' },
      ),
      makeCandidate(
        { id: 'seen-tweet-2', created_at: now.toISOString() },
        { id: 'author-seen-2' },
      ),
    ];

    let result = [...candidates];
    for (const filter of chain) {
      result = filter.filter(query, result);
    }

    expect(result.length).toBe(15);
    const ids = new Set(result.map((c) => c.tweet.id));
    expect(ids.has('normal-0')).toBe(true);
    expect(ids.has('old-tweet')).toBe(false);
    expect(ids.has('self-tweet')).toBe(false);
    expect(ids.has('seen-tweet-1')).toBe(false);
    expect(ids.has('seen-tweet-2')).toBe(false);
  });

  it('handles empty input through entire chain', () => {
    const chain = createFilterChain();
    const query = makeQuery();
    let result: ScoredCandidate[] = [];
    for (const filter of chain) {
      result = filter.filter(query, result);
    }
    expect(result).toEqual([]);
  });
});

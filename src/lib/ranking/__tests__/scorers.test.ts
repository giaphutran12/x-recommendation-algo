import { describe, it, expect } from 'vitest';
import { EngagementPredictor } from '../scorers/engagement-predictor';
import { WeightedScorer } from '../scorers/weighted-scorer';
import { AuthorDiversityScorer } from '../scorers/author-diversity-scorer';
import { OutOfNetworkScorer } from '../scorers/oon-scorer';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { Tweet, User, AlgorithmWeights } from '@/lib/types/database';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    display_name: 'Test User',
    bio: '',
    avatar_url: '',
    persona_type: 'tech',
    interests: ['tech', 'ai'],
    writing_style: 'casual',
    follower_count: 10000,
    following_count: 500,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeTweet(overrides: Partial<Tweet> = {}): Tweet {
  return {
    id: 'tweet-1',
    author_id: 'user-1',
    content: 'Hello world',
    tweet_type: 'original',
    parent_tweet_id: null,
    quoted_tweet_id: null,
    topic: 'tech',
    embedding: null,
    like_count: 10,
    reply_count: 2,
    repost_count: 3,
    click_count: 5,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeWeights(overrides: Partial<AlgorithmWeights> = {}): AlgorithmWeights {
  return {
    user_id: 'viewer-1',
    recency_weight: 1.0,
    popularity_weight: 1.0,
    network_weight: 1.0,
    topic_relevance_weight: 1.0,
    engagement_type_weights: {
      like: 1.0,
      reply: 1.0,
      repost: 1.0,
      click: 1.0,
      follow_author: 1.0,
      not_interested: -1.0,
    },
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeQuery(overrides: Partial<AlgorithmWeights> = {}): FeedQuery {
  return {
    viewer_id: 'viewer-1',
    seen_ids: [],
    served_ids: [],
    algorithm_weights: makeWeights(overrides),
    limit: 20,
  };
}

function makeCandidate(
  tweetOverrides: Partial<Tweet> = {},
  authorOverrides: Partial<User> = {},
  candidateOverrides: Partial<ScoredCandidate> = {},
): ScoredCandidate {
  return {
    tweet: makeTweet(tweetOverrides),
    author: makeUser(authorOverrides),
    score: 0,
    in_network: true,
    engagement_predictions: null,
    explanation: null,
    ...candidateOverrides,
  };
}

describe('EngagementPredictor', () => {
  it('produces predictions in [0, 1] range for all engagement types', async () => {
    const query = makeQuery();
    const candidates = [
      makeCandidate({ like_count: 500, repost_count: 200 }, { follower_count: 50000 }),
      makeCandidate({ content: 'What do you think?' }, { follower_count: 1000000 }),
    ];

    const result = await EngagementPredictor.score(query, candidates);

    for (const candidate of result) {
      const preds = candidate.engagement_predictions!;
      expect(preds).not.toBeNull();
      for (const [key, value] of Object.entries(preds)) {
        expect(value, `${key} out of range`).toBeGreaterThanOrEqual(0);
        expect(value, `${key} out of range`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives OON candidates higher follow_author probability than in-network', async () => {
    const query = makeQuery();
    const inNetwork = makeCandidate({}, {}, { in_network: true });
    const outOfNetwork = makeCandidate({}, {}, { in_network: false });

    const [inResult, oonResult] = await EngagementPredictor.score(query, [inNetwork, outOfNetwork]);

    expect(oonResult.engagement_predictions!.follow_author).toBeGreaterThan(
      inResult.engagement_predictions!.follow_author,
    );
  });

  it('assigns higher like probability to tweets with more followers', async () => {
    const query = makeQuery();
    const lowFollower = makeCandidate({}, { follower_count: 100 });
    const highFollower = makeCandidate({}, { follower_count: 1000000 });

    const [low, high] = await EngagementPredictor.score(query, [lowFollower, highFollower]);

    expect(high.engagement_predictions!.like).toBeGreaterThan(low.engagement_predictions!.like);
  });

  it('is deterministic: same input yields same output', async () => {
    const query = makeQuery();
    const candidates = [
      makeCandidate({ like_count: 100, reply_count: 5 }, { follower_count: 50000 }),
      makeCandidate({ content: 'Is this deterministic?' }, { follower_count: 200000 }),
    ];

    const result1 = await EngagementPredictor.score(query, candidates);
    const result2 = await EngagementPredictor.score(query, candidates);

    for (let i = 0; i < result1.length; i++) {
      const p1 = result1[i].engagement_predictions!;
      const p2 = result2[i].engagement_predictions!;
      expect(p1.like).toBe(p2.like);
      expect(p1.reply).toBe(p2.reply);
      expect(p1.repost).toBe(p2.repost);
      expect(p1.click).toBe(p2.click);
      expect(p1.follow_author).toBe(p2.follow_author);
      expect(p1.not_interested).toBe(p2.not_interested);
    }
  });

  it('falls back to heuristic when ONNX model is not loaded', async () => {
    const query = makeQuery();
    const candidate = makeCandidate({ like_count: 0, reply_count: 0, repost_count: 0 });

    const [result] = await EngagementPredictor.score(query, [candidate]);
    const preds = result.engagement_predictions!;

    expect(preds).not.toBeNull();
    expect(preds.click).toBe(0.1);
    expect(preds.not_interested).toBe(0.05);
  });
});

describe('WeightedScorer', () => {
  it('higher recency_weight boosts newer tweets above older ones', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const fortyHoursAgo = new Date(now.getTime() - 40 * 60 * 60 * 1000);

    const newTweet = makeCandidate({ created_at: oneHourAgo.toISOString(), like_count: 0, reply_count: 0, repost_count: 0 });
    const oldTweet = makeCandidate({ id: 'tweet-2', created_at: fortyHoursAgo.toISOString(), like_count: 0, reply_count: 0, repost_count: 0 });

    const withPredictions = [newTweet, oldTweet].map((c) => ({
      ...c,
      engagement_predictions: {
        like: 0,
        reply: 0,
        repost: 0,
        click: 0,
        follow_author: 0,
        not_interested: 0,
      },
    }));

    const recencyQuery = makeQuery({
      recency_weight: 5.0,
      popularity_weight: 0,
      network_weight: 0,
      topic_relevance_weight: 0,
      engagement_type_weights: { like: 0, reply: 0, repost: 0, click: 0, follow_author: 0, not_interested: 0 },
    } as AlgorithmWeights);

    const result = await WeightedScorer.score(recencyQuery, withPredictions);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('higher popularity_weight boosts popular tweets above unpopular ones', async () => {
    const now = new Date().toISOString();
    const popular = makeCandidate({ created_at: now, like_count: 10000, reply_count: 500, repost_count: 2000 });
    const unpopular = makeCandidate({ id: 'tweet-2', created_at: now, like_count: 1, reply_count: 0, repost_count: 0 });

    const withPredictions = [popular, unpopular].map((c) => ({
      ...c,
      engagement_predictions: {
        like: 0,
        reply: 0,
        repost: 0,
        click: 0,
        follow_author: 0,
        not_interested: 0,
      },
    }));

    const popularityQuery = makeQuery({
      recency_weight: 0,
      popularity_weight: 5.0,
      network_weight: 0,
      topic_relevance_weight: 0,
      engagement_type_weights: { like: 0, reply: 0, repost: 0, click: 0, follow_author: 0, not_interested: 0 },
    } as AlgorithmWeights);

    const result = await WeightedScorer.score(popularityQuery, withPredictions);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('sets explanation with correct structure', async () => {
    const query = makeQuery();
    const candidate = {
      ...makeCandidate(),
      engagement_predictions: {
        like: 0.3,
        reply: 0.05,
        repost: 0.1,
        click: 0.1,
        follow_author: 0.01,
        not_interested: 0.05,
      },
    };

    const [result] = await WeightedScorer.score(query, [candidate]);

    expect(result.explanation).not.toBeNull();
    expect(result.explanation!.authorDiversityMultiplier).toBe(1.0);
    expect(result.explanation!.oonMultiplier).toBe(1.0);
    expect(result.explanation!.totalScore).toBe(result.score);
  });
});

describe('AuthorDiversityScorer', () => {
  it('penalizes the 2nd tweet from the same author', async () => {
    const query = makeQuery();
    const author = makeUser({ id: 'author-1' });

    const first = makeCandidate({}, author, { score: 10 });
    const second = makeCandidate({ id: 'tweet-2' }, author, { score: 9 });
    const different = makeCandidate({ id: 'tweet-3' }, makeUser({ id: 'author-2' }), { score: 8 });

    const result = await AuthorDiversityScorer.score(query, [first, second, different]);

    const firstResult = result.find((c) => c.tweet.id === 'tweet-1')!;
    const secondResult = result.find((c) => c.tweet.id === 'tweet-2')!;

    expect(secondResult.score).toBeLessThan(firstResult.score);
  });

  it('applies exponential decay — 3rd appearance is penalized more than 2nd', async () => {
    const query = makeQuery();
    const author = makeUser({ id: 'same-author' });

    const tweets = [
      makeCandidate({ id: 'tweet-1' }, author, { score: 30 }),
      makeCandidate({ id: 'tweet-2' }, author, { score: 29 }),
      makeCandidate({ id: 'tweet-3' }, author, { score: 28 }),
    ];

    const result = await AuthorDiversityScorer.score(query, tweets);

    const scores = result
      .sort((a, b) => Number(a.tweet.id.slice(-1)) - Number(b.tweet.id.slice(-1)))
      .map((c) => c.score);

    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[1]).toBeGreaterThan(scores[2]);
  });

  it('leaves first appearance from each author untouched', async () => {
    const query = makeQuery();
    const authorA = makeUser({ id: 'author-a' });
    const authorB = makeUser({ id: 'author-b' });

    const a1 = makeCandidate({ id: 'a1' }, authorA, { score: 5 });
    const b1 = makeCandidate({ id: 'b1' }, authorB, { score: 4 });

    const result = await AuthorDiversityScorer.score(query, [a1, b1]);

    expect(result.find((c) => c.tweet.id === 'a1')!.score).toBe(5);
    expect(result.find((c) => c.tweet.id === 'b1')!.score).toBe(4);
  });
});

describe('OutOfNetworkScorer', () => {
  it('penalizes out-of-network candidates by 0.7x', async () => {
    const query = makeQuery();
    const oon: ScoredCandidate = {
      ...makeCandidate({}, {}, { in_network: false, score: 10 }),
      explanation: {
        recencyScore: 4,
        popularityScore: 3,
        networkScore: 2,
        topicScore: 1,
        engagementTypeScores: { like: 0, reply: 0, repost: 0, click: 0, follow_author: 0, not_interested: 0 },
        authorDiversityMultiplier: 1.0,
        oonMultiplier: 1.0,
        totalScore: 10,
      },
    };

    const [result] = await OutOfNetworkScorer.score(query, [oon]);

    expect(result.score).toBeCloseTo(7.0);
    expect(result.explanation?.oonMultiplier).toBe(0.7);
  });

  it('leaves in-network candidates unchanged', async () => {
    const query = makeQuery();
    const inNet = makeCandidate({}, {}, { in_network: true, score: 10 });

    const [result] = await OutOfNetworkScorer.score(query, [inNet]);

    expect(result.score).toBe(10);
  });

  it('updates explanation totalScore after penalty', async () => {
    const query = makeQuery();
    const oon: ScoredCandidate = {
      ...makeCandidate({}, {}, { in_network: false, score: 20 }),
      explanation: {
        recencyScore: 5,
        popularityScore: 5,
        networkScore: 5,
        topicScore: 5,
        engagementTypeScores: { like: 0, reply: 0, repost: 0, click: 0, follow_author: 0, not_interested: 0 },
        authorDiversityMultiplier: 1.0,
        oonMultiplier: 1.0,
        totalScore: 20,
      },
    };

    const [result] = await OutOfNetworkScorer.score(query, [oon]);

    expect(result.explanation!.totalScore).toBeCloseTo(14.0);
    expect(result.explanation!.oonMultiplier).toBe(0.7);
  });
});

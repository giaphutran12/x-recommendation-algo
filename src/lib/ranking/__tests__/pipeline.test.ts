import { describe, it, expect, vi } from 'vitest';
import { RankingPipeline } from '../pipeline';
import type { CandidateSource, Hydrator, Filter, Scorer, Selector } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate, ScoreExplanation } from '@/lib/types/ranking';
import type { Tweet, User, AlgorithmWeights } from '@/lib/types/database';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    display_name: 'Test User',
    bio: '',
    avatar_url: '',
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

function makeWeights(): AlgorithmWeights {
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
  };
}

function makeQuery(overrides: Partial<FeedQuery> = {}): FeedQuery {
  return {
    viewer_id: 'viewer-1',
    seen_ids: [],
    served_ids: [],
    algorithm_weights: makeWeights(),
    limit: 20,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    tweet: makeTweet(),
    author: makeUser(),
    score: 0,
    in_network: true,
    engagement_predictions: null,
    explanation: null,
    ...overrides,
  };
}

function makeExplanation(score: number): ScoreExplanation {
  return {
    recencyScore: score * 0.25,
    popularityScore: score * 0.25,
    networkScore: score * 0.25,
    topicScore: score * 0.25,
    engagementTypeScores: { like: 0, reply: 0, repost: 0, click: 0, follow_author: 0, not_interested: 0 },
    authorDiversityMultiplier: 1.0,
    oonMultiplier: 1.0,
    totalScore: score,
  };
}

function makeMockSource(candidates: ScoredCandidate[], name = 'MockSource'): CandidateSource {
  return {
    name,
    retrieve: vi.fn().mockResolvedValue(candidates),
  };
}

function makeMockHydrator(name = 'MockHydrator'): Hydrator {
  return {
    name,
    hydrate: vi.fn().mockImplementation((_query, candidates) => Promise.resolve(candidates)),
  };
}

function makeMockFilter(name = 'MockFilter'): Filter {
  return {
    name,
    filter: vi.fn().mockImplementation((_query, candidates) => candidates),
  };
}

function makeMockScorer(scoreValue: number, name = 'MockScorer'): Scorer {
  return {
    name,
    score: vi.fn().mockImplementation((_query, candidates: ScoredCandidate[]) =>
      Promise.resolve(
        candidates.map((c: ScoredCandidate, i: number) => ({
          ...c,
          score: scoreValue - i,
          explanation: makeExplanation(scoreValue - i),
        }))
      )
    ),
  };
}

function makeMockSelector(name = 'MockSelector'): Selector {
  return {
    name,
    select: vi.fn().mockImplementation((_query, candidates) => candidates),
  };
}

describe('RankingPipeline', () => {
  describe('execute', () => {
    it('retrieves candidates from all sources in parallel and flattens results', async () => {
      const source1Candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-1' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-2' }) }),
      ];
      const source2Candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-3' }) }),
      ];

      const source1 = makeMockSource(source1Candidates, 'Source1');
      const source2 = makeMockSource(source2Candidates, 'Source2');
      const scorer = makeMockScorer(10);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source1, source2], [], [], [scorer], [selector]);
      const result = await pipeline.execute(makeQuery());

      expect(source1.retrieve).toHaveBeenCalledOnce();
      expect(source2.retrieve).toHaveBeenCalledOnce();
      expect(result).toHaveLength(3);
    });

    it('passes candidates through hydrators sequentially', async () => {
      const callOrder: string[] = [];
      const candidates = [makeCandidate()];

      const source = makeMockSource(candidates);
      const hydrator1: Hydrator = {
        name: 'Hydrator1',
        hydrate: vi.fn().mockImplementation((_q, c) => {
          callOrder.push('hydrator1');
          return Promise.resolve(c);
        }),
      };
      const hydrator2: Hydrator = {
        name: 'Hydrator2',
        hydrate: vi.fn().mockImplementation((_q, c) => {
          callOrder.push('hydrator2');
          return Promise.resolve(c);
        }),
      };
      const scorer = makeMockScorer(5);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [hydrator1, hydrator2], [], [scorer], [selector]);
      await pipeline.execute(makeQuery());

      expect(callOrder).toEqual(['hydrator1', 'hydrator2']);
    });

    it('passes candidates through filters sequentially', async () => {
      const callOrder: string[] = [];
      const candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-1' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-2' }) }),
      ];

      const source = makeMockSource(candidates);
      const filter1: Filter = {
        name: 'Filter1',
        filter: vi.fn().mockImplementation((_q, c) => {
          callOrder.push('filter1');
          return c;
        }),
      };
      const filter2: Filter = {
        name: 'Filter2',
        filter: vi.fn().mockImplementation((_q, c) => {
          callOrder.push('filter2');
          return c;
        }),
      };
      const scorer = makeMockScorer(5);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [], [filter1, filter2], [scorer], [selector]);
      await pipeline.execute(makeQuery());

      expect(callOrder).toEqual(['filter1', 'filter2']);
    });

    it('passes candidates through scorers sequentially', async () => {
      const callOrder: string[] = [];
      const candidates = [makeCandidate()];

      const source = makeMockSource(candidates);
      const scorer1: Scorer = {
        name: 'Scorer1',
        score: vi.fn().mockImplementation((_q, c: ScoredCandidate[]) => {
          callOrder.push('scorer1');
          return Promise.resolve(c.map((x: ScoredCandidate) => ({ ...x, score: 5, explanation: makeExplanation(5) })));
        }),
      };
      const scorer2: Scorer = {
        name: 'Scorer2',
        score: vi.fn().mockImplementation((_q, c: ScoredCandidate[]) => {
          callOrder.push('scorer2');
          return Promise.resolve(c);
        }),
      };
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [], [], [scorer1, scorer2], [selector]);
      await pipeline.execute(makeQuery());

      expect(callOrder).toEqual(['scorer1', 'scorer2']);
    });

    it('output is sorted by score descending when selector preserves order', async () => {
      const candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-low' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-high' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-mid' }) }),
      ];

      const source = makeMockSource(candidates);
      const scorer: Scorer = {
        name: 'FixedScorer',
        score: vi.fn().mockImplementation((_q, c: ScoredCandidate[]) =>
          Promise.resolve(
            c.map((candidate) => {
              const scores: Record<string, number> = {
                'tweet-high': 10,
                'tweet-mid': 5,
                'tweet-low': 1,
              };
              const s = scores[candidate.tweet.id] ?? 0;
              return { ...candidate, score: s, explanation: makeExplanation(s) };
            })
          )
        ),
      };

      const sortingSelector: Selector = {
        name: 'SortingSelector',
        select: vi.fn().mockImplementation((_q, c: ScoredCandidate[]) =>
          [...c].sort((a, b) => b.score - a.score)
        ),
      };

      const pipeline = new RankingPipeline([source], [], [], [scorer], [sortingSelector]);
      const result = await pipeline.execute(makeQuery());

      expect(result[0].tweet.id).toBe('tweet-high');
      expect(result[1].tweet.id).toBe('tweet-mid');
      expect(result[2].tweet.id).toBe('tweet-low');
    });

    it('output candidates have ScoreExplanation populated after scoring', async () => {
      const candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-1' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-2' }) }),
      ];

      const source = makeMockSource(candidates);
      const scorer = makeMockScorer(10);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [], [], [scorer], [selector]);
      const result = await pipeline.execute(makeQuery());

      for (const candidate of result) {
        expect(candidate.explanation).not.toBeNull();
        expect(candidate.explanation!.totalScore).toBe(candidate.score);
        expect(candidate.explanation!.authorDiversityMultiplier).toBe(1.0);
        expect(candidate.explanation!.oonMultiplier).toBe(1.0);
      }
    });

    it('returns empty array when sources return no candidates', async () => {
      const source = makeMockSource([]);
      const scorer = makeMockScorer(10);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [], [], [scorer], [selector]);
      const result = await pipeline.execute(makeQuery());

      expect(result).toHaveLength(0);
    });

    it('filters can reduce candidate count', async () => {
      const candidates = [
        makeCandidate({ tweet: makeTweet({ id: 'tweet-keep' }) }),
        makeCandidate({ tweet: makeTweet({ id: 'tweet-remove' }) }),
      ];

      const source = makeMockSource(candidates);
      const removingFilter: Filter = {
        name: 'RemovingFilter',
        filter: vi.fn().mockImplementation((_q, c: ScoredCandidate[]) =>
          c.filter((x) => x.tweet.id !== 'tweet-remove')
        ),
      };
      const scorer = makeMockScorer(5);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [], [removingFilter], [scorer], [selector]);
      const result = await pipeline.execute(makeQuery());

      expect(result).toHaveLength(1);
      expect(result[0].tweet.id).toBe('tweet-keep');
    });

    it('calls all stages with the query object', async () => {
      const query = makeQuery({ viewer_id: 'specific-viewer' });
      const candidate = makeCandidate();

      const source = makeMockSource([candidate]);
      const hydrator = makeMockHydrator();
      const filter = makeMockFilter();
      const scorer = makeMockScorer(5);
      const selector = makeMockSelector();

      const pipeline = new RankingPipeline([source], [hydrator], [filter], [scorer], [selector]);
      await pipeline.execute(query);

      expect(source.retrieve).toHaveBeenCalledWith(query);
      expect(hydrator.hydrate).toHaveBeenCalledWith(query, expect.any(Array));
      expect(filter.filter).toHaveBeenCalledWith(query, expect.any(Array));
      expect(scorer.score).toHaveBeenCalledWith(query, expect.any(Array));
      expect(selector.select).toHaveBeenCalledWith(query, expect.any(Array));
    });
  });
});

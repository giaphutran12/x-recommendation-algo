import { describe, it, expect } from 'vitest';
import { TopKSelector } from '@/lib/ranking/selectors';
import type { ScoredCandidate, FeedQuery } from '@/lib/types/ranking';
import type { Tweet, User } from '@/lib/types/database';

const createMockWeights = () => ({
  user_id: 'viewer1',
  recency_weight: 0.2,
  popularity_weight: 0.2,
  network_weight: 0.2,
  topic_relevance_weight: 0.2,
  engagement_type_weights: {
    like: 0.2,
    reply: 0.2,
    repost: 0.2,
    click: 0.1,
    follow_author: 0.1,
    not_interested: 0,
  },
  updated_at: new Date().toISOString(),
});

describe('TopKSelector', () => {
  const selector = new TopKSelector();

  const createMockTweet = (id: string, authorId: string): Tweet => ({
    id,
    author_id: authorId,
    content: `Tweet ${id}`,
    created_at: new Date().toISOString(),
    tweet_type: 'original',
    parent_tweet_id: null,
    quoted_tweet_id: null,
    topic: 'test',
    embedding: null,
    like_count: 0,
    reply_count: 0,
    repost_count: 0,
    click_count: 0,
  });

  const createMockUser = (id: string): User => ({
    id,
    username: `user_${id}`,
    display_name: `User ${id}`,
    bio: 'Test user',
    avatar_url: '',
    persona_type: 'tech',
    interests: [],
    writing_style: 'casual',
    follower_count: 100,
    following_count: 50,
    created_at: new Date().toISOString(),
  });

  const createMockCandidate = (
    tweetId: string,
    authorId: string,
    score: number
  ): ScoredCandidate => ({
    tweet: createMockTweet(tweetId, authorId),
    author: createMockUser(authorId),
    score,
    in_network: false,
    engagement_predictions: null,
    explanation: null,
  });

  it('should enforce author diversity in top 20', () => {
    // Create 20 candidates: 10 from author-A (high scores), 10 from others
    const candidates: ScoredCandidate[] = [];

    // Author A: 10 tweets with scores 100-91
    for (let i = 0; i < 10; i++) {
      candidates.push(createMockCandidate(`a${i}`, 'author-a', 100 - i));
    }

    // Other authors: 10 tweets with scores 85-76
    for (let i = 0; i < 10; i++) {
      candidates.push(
        createMockCandidate(`other${i}`, `author-${i}`, 85 - i)
      );
    }

    const query: FeedQuery = {
      viewer_id: 'viewer1',
      seen_ids: [],
      served_ids: [],
      algorithm_weights: createMockWeights(),
      limit: 20,
    };

    const result = selector.select(query, candidates);

    // In top 20 (or all results if < 20), author-a should have ≤ 3
    const topWindow = Math.min(20, result.length);
    const authorAInWindow = result
      .slice(0, topWindow)
      .filter((c) => c.tweet.author_id === 'author-a').length;

    expect(authorAInWindow).toBeLessThanOrEqual(3);
    // Result should be limited by diversity: 3 from author-a + 10 others = 13
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('should return exactly K candidates', () => {
    const candidates: ScoredCandidate[] = [];

    for (let i = 0; i < 100; i++) {
      candidates.push(
        createMockCandidate(`tweet${i}`, `author-${i % 10}`, 100 - i)
      );
    }

    const query: FeedQuery = {
      viewer_id: 'viewer1',
      seen_ids: [],
      served_ids: [],
      algorithm_weights: createMockWeights(),
      limit: 50,
    };

    const result = selector.select(query, candidates);

    expect(result.length).toBe(50);
  });

  it('should return fewer than K if input has fewer candidates', () => {
    const candidates: ScoredCandidate[] = [];

    for (let i = 0; i < 10; i++) {
      candidates.push(
        createMockCandidate(`tweet${i}`, `author-${i}`, 100 - i)
      );
    }

    const query: FeedQuery = {
      viewer_id: 'viewer1',
      seen_ids: [],
      served_ids: [],
      algorithm_weights: createMockWeights(),
      limit: 50,
    };

    const result = selector.select(query, candidates);

    expect(result.length).toBe(10);
  });

  it('should maintain score ordering in output', () => {
    const candidates: ScoredCandidate[] = [];

    for (let i = 0; i < 30; i++) {
      candidates.push(
        createMockCandidate(`tweet${i}`, `author-${i % 5}`, 100 - i)
      );
    }

    const query: FeedQuery = {
      viewer_id: 'viewer1',
      seen_ids: [],
      served_ids: [],
      algorithm_weights: createMockWeights(),
      limit: 20,
    };

    const result = selector.select(query, candidates);

    // Check that scores are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });
});

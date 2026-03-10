import { describe, it, expect, vi } from 'vitest';
import { InNetworkSource } from '../in-network-source';
import { OutOfNetworkSource } from '../out-of-network-source';
import type { FeedQuery } from '@/lib/types/ranking';
import type { AlgorithmWeights } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const FOLLOWED_ID = '00000000-0000-0000-0000-000000000002';
const OON_AUTHOR_ID = '00000000-0000-0000-0000-000000000003';

const mockWeights: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 0.5,
  popularity_weight: 0.5,
  network_weight: 0.5,
  topic_relevance_weight: 0.5,
  engagement_type_weights: {
    like: 1.0,
    reply: 1.5,
    repost: 1.0,
    click: 0.5,
    follow_author: 2.0,
    not_interested: -3.0,
  },
  updated_at: new Date().toISOString(),
};

const mockQuery: FeedQuery = {
  viewer_id: VIEWER_ID,
  seen_ids: [],
  served_ids: [],
  algorithm_weights: mockWeights,
  limit: 20,
};

const mockUser = {
  id: FOLLOWED_ID,
  username: 'followed_user',
  display_name: 'Followed User',
  bio: '',
  avatar_url: '',
  persona_type: 'tech' as const,
  interests: [],
  writing_style: '',
  follower_count: 100,
  following_count: 50,
  created_at: new Date().toISOString(),
};

const mockTweet = {
  id: 'tweet-1',
  author_id: FOLLOWED_ID,
  content: 'Hello from followed user',
  tweet_type: 'original' as const,
  parent_tweet_id: null,
  quoted_tweet_id: null,
  topic: 'tech',
  embedding: null,
  like_count: 10,
  reply_count: 2,
  repost_count: 1,
  click_count: 5,
  created_at: new Date().toISOString(),
  author: mockUser,
};

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    ...overrides,
  };
  return {
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    _builder: builder,
  };
}

describe('InNetworkSource', () => {
  it('has correct name', () => {
    const supabase = makeSupabaseMock();
    const source = new InNetworkSource(supabase as never);
    expect(source.name).toBe('InNetworkSource');
  });

  it('returns empty array when viewer has no follows', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const supabase = { from: vi.fn().mockReturnValue(builder), rpc: vi.fn() };
    const source = new InNetworkSource(supabase as never);

    const result = await source.retrieve(mockQuery);
    expect(result).toEqual([]);
  });

  it('returns empty array on follows fetch error', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    };
    const supabase = { from: vi.fn().mockReturnValue(builder) };
    const source = new InNetworkSource(supabase as never);

    const result = await source.retrieve(mockQuery);
    expect(result).toEqual([]);
  });

  it('returns ScoredCandidates with in_network=true for tweets from followed accounts', async () => {
    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ following_id: FOLLOWED_ID }],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockTweet], error: null }),
        };
      }),
    };

    const source = new InNetworkSource(supabase as never);
    const result = await source.retrieve(mockQuery);

    expect(result).toHaveLength(1);
    expect(result[0].in_network).toBe(true);
    expect(result[0].score).toBe(0);
    expect(result[0].engagement_predictions).toBeNull();
    expect(result[0].explanation).toBeNull();
    expect(result[0].author).toEqual(mockUser);
  });
});

describe('OutOfNetworkSource', () => {
  it('has correct name', () => {
    const supabase = makeSupabaseMock();
    const source = new OutOfNetworkSource(supabase as never);
    expect(source.name).toBe('OutOfNetworkSource');
  });

  it('returns empty array gracefully when no tweets in DB', async () => {
    const followsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const engagementsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const popularityBuilder = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'follows') return followsBuilder;
        if (table === 'engagements') {
          callCount++;
          return engagementsBuilder;
        }
        return popularityBuilder;
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const source = new OutOfNetworkSource(supabase as never);
    const result = await source.retrieve(mockQuery);
    expect(result).toEqual([]);
    expect(callCount).toBe(1);
  });

  it('falls back to popularity when rpc returns error', async () => {
    const mockOonTweet = {
      ...mockTweet,
      id: 'oon-tweet-1',
      author_id: OON_AUTHOR_ID,
      author: { ...mockUser, id: OON_AUTHOR_ID },
    };

    const embeddingVector = new Array(1536).fill(0.1);

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'engagements') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ tweet_id: 'tweet-abc' }],
              error: null,
            }),
          };
        }
        if (table === 'tweets') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ embedding: embeddingVector }],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockOonTweet], error: null }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } }),
    };

    const source = new OutOfNetworkSource(supabase as never);
    const result = await source.retrieve(mockQuery);

    expect(result).toHaveLength(1);
    expect(result[0].in_network).toBe(false);
    expect(result[0].score).toBe(0);
  });

  it('returns candidates with in_network=false', async () => {
    const mockOonTweet = {
      ...mockTweet,
      id: 'oon-tweet-2',
      author_id: OON_AUTHOR_ID,
      author: { ...mockUser, id: OON_AUTHOR_ID },
    };

    const embeddingVector = new Array(1536).fill(0.2);

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'engagements') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ tweet_id: 'tweet-xyz' }],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({ data: [{ embedding: embeddingVector }], error: null }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({ data: [mockOonTweet], error: null }),
    };

    const source = new OutOfNetworkSource(supabase as never);
    const result = await source.retrieve(mockQuery);

    expect(result).toHaveLength(1);
    expect(result[0].in_network).toBe(false);
  });
});

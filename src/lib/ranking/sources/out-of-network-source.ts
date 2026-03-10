import type { SupabaseClient } from '@supabase/supabase-js';
import type { CandidateSource } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { Tweet, User } from '@/lib/types/database';

const OON_TIME_WINDOW_HOURS = 72;
const OON_MAX_CANDIDATES = 100;
const OON_ENGAGEMENT_LOOKBACK = 50;

function averageEmbeddings(embeddings: number[][]): number[] | null {
  if (embeddings.length === 0) return null;
  const dim = embeddings[0].length;
  const sum = new Array<number>(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      sum[i] += emb[i];
    }
  }
  return sum.map((v) => v / embeddings.length);
}

export class OutOfNetworkSource implements CandidateSource {
  readonly name = 'OutOfNetworkSource';

  constructor(private readonly supabase: SupabaseClient) {}

  async retrieve(query: FeedQuery): Promise<ScoredCandidate[]> {
    const { data: follows } = await this.supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', query.viewer_id);

    const followedIds: string[] = follows
      ? follows.map((f: { following_id: string }) => f.following_id)
      : [];

    const excludedIds = [query.viewer_id, ...followedIds];

    const queryVector = await this.buildQueryVector(query.viewer_id);

    if (queryVector) {
      return this.retrieveByEmbedding(queryVector, excludedIds);
    }

    return this.retrieveByPopularity(excludedIds);
  }

  private async buildQueryVector(viewerId: string): Promise<number[] | null> {
    const { data: engagements } = await this.supabase
      .from('engagements')
      .select('tweet_id')
      .eq('user_id', viewerId)
      .in('engagement_type', ['like', 'repost', 'reply', 'click'])
      .order('created_at', { ascending: false })
      .limit(OON_ENGAGEMENT_LOOKBACK);

    if (!engagements || engagements.length === 0) return null;

    const tweetIds = engagements.map((e: { tweet_id: string }) => e.tweet_id);

    const { data: tweets } = await this.supabase
      .from('tweets')
      .select('embedding')
      .in('id', tweetIds)
      .not('embedding', 'is', null);

    if (!tweets || tweets.length === 0) return null;

    const embeddings = tweets
      .map((t: { embedding: number[] | null }) => t.embedding)
      .filter((emb): emb is number[] => emb !== null);

    return averageEmbeddings(embeddings);
  }

  private async retrieveByEmbedding(
    queryVector: number[],
    excludedIds: string[]
  ): Promise<ScoredCandidate[]> {
    const cutoff = new Date(
      Date.now() - OON_TIME_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const vectorLiteral = `[${queryVector.join(',')}]`;

    const { data: rows, error } = await this.supabase.rpc('match_tweets_by_embedding', {
      query_embedding: vectorLiteral,
      excluded_author_ids: excludedIds,
      time_cutoff: cutoff,
      match_count: OON_MAX_CANDIDATES,
    });

    if (error) {
      console.error('[RANK] Out-of-network source: rpc error, falling back to popularity:', error.message);
      return this.retrieveByPopularity(excludedIds);
    }

    if (!rows || rows.length === 0) {
      console.log('[RANK] Out-of-network source: retrieved 0 candidates via embedding similarity (cosine)');
      return [];
    }

    const candidates = this.mapRowsToCandidates(rows, false);

    console.log(
      `[RANK] Out-of-network source: retrieved ${candidates.length} candidates via embedding similarity (cosine)`
    );

    return candidates;
  }

  private async retrieveByPopularity(excludedIds: string[]): Promise<ScoredCandidate[]> {
    const cutoff = new Date(
      Date.now() - OON_TIME_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: rows, error } = await this.supabase
      .from('tweets')
      .select('*, author:users!author_id(*)')
      .not('author_id', 'in', `(${excludedIds.join(',')})`)
      .gte('created_at', cutoff)
      .order('like_count', { ascending: false })
      .limit(OON_MAX_CANDIDATES);

    if (error || !rows) {
      console.error('[RANK] Out-of-network source: popularity fallback error:', error?.message);
      return [];
    }

    const candidates = this.mapRowsToCandidates(rows, false);

    console.log(
      `[RANK] Out-of-network source: retrieved ${candidates.length} candidates via popularity fallback`
    );

    return candidates;
  }

  private mapRowsToCandidates(rows: Record<string, unknown>[], inNetwork: boolean): ScoredCandidate[] {
    return rows.map((row) => {
      const { author, ...tweetFields } = row as { author: User } & Record<string, unknown>;
      return {
        tweet: tweetFields as unknown as Tweet,
        author,
        score: 0,
        in_network: inNetwork,
        engagement_predictions: null,
        explanation: null,
      };
    });
  }
}

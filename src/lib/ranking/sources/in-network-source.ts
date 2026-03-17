import type { SupabaseClient } from '@supabase/supabase-js';
import type { CandidateSource } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { Tweet, User } from '@/lib/types/database';

const IN_NETWORK_TIME_WINDOW_HOURS = 8760; // 365 days — demo app with static seed data
const IN_NETWORK_MAX_CANDIDATES = 200;

export class InNetworkSource implements CandidateSource {
  readonly name = 'InNetworkSource';

  constructor(private readonly supabase: SupabaseClient) {}

  async retrieve(query: FeedQuery): Promise<ScoredCandidate[]> {
    const { data: follows, error: followsError } = await this.supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', query.viewer_id);

    if (followsError) {
      console.error('[RANK] In-network source: failed to fetch follows:', followsError.message);
      return [];
    }

    if (!follows || follows.length === 0) {
      console.log('[RANK] In-network source: retrieved 0 candidates from 0 followed accounts');
      return [];
    }

    const followedIds = follows.map((f: { following_id: string }) => f.following_id);
    const cutoff = new Date(
      Date.now() - IN_NETWORK_TIME_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: rows, error: tweetsError } = await this.supabase
      .from('tweets')
      .select('*, author:users!author_id(*)')
      .in('author_id', followedIds)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(IN_NETWORK_MAX_CANDIDATES);

    if (tweetsError) {
      console.error('[RANK] In-network source: failed to fetch tweets:', tweetsError.message);
      return [];
    }

    if (!rows || rows.length === 0) {
      console.log(
        `[RANK] In-network source: retrieved 0 candidates from ${followedIds.length} followed accounts`
      );
      return [];
    }

    const candidates: ScoredCandidate[] = rows
      .map((row) => {
        const { author, ...tweetFields } = row as { author: User } & Record<string, unknown>;
        if (!tweetFields.id || !tweetFields.content || !tweetFields.author_id) {
          console.error('[RANK] Invalid tweet row, skipping:', tweetFields.id);
          return null;
        }
        return {
          tweet: tweetFields as unknown as Tweet,
          author,
          score: 0,
          in_network: true,
          engagement_predictions: null,
          explanation: null,
        } as ScoredCandidate;
      })
      .filter((candidate): candidate is ScoredCandidate => candidate !== null);

    console.log(
      `[RANK] In-network source: retrieved ${candidates.length} candidates from ${followedIds.length} followed accounts`
    );

    return candidates;
  }
}

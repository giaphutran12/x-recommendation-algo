import type { SupabaseClient } from '@supabase/supabase-js';
import type { Hydrator } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class EngagementHydrator implements Hydrator {
  readonly name = 'EngagementHydrator';

  constructor(private supabase: SupabaseClient) {}

  async hydrate(
    query: FeedQuery,
    candidates: ScoredCandidate[]
  ): Promise<ScoredCandidate[]> {
    if (candidates.length === 0) return candidates;

    const tweetIds = candidates.map((c) => c.tweet.id);
    const authorIds = [...new Set(candidates.map((c) => c.tweet.author_id))];

    const [engagementCountsResult, viewerEngagementsResult] =
      await Promise.all([
        this.supabase
          .from('tweets')
          .select('id, like_count, reply_count, repost_count, click_count')
          .in('id', tweetIds),
        this.supabase
          .from('engagements')
          .select('tweet_id')
          .eq('user_id', query.viewer_id),
      ]);

    const countsMap = new Map<
      string,
      {
        like_count: number;
        reply_count: number;
        repost_count: number;
        click_count: number;
      }
    >();
    if (engagementCountsResult.data) {
      for (const row of engagementCountsResult.data) {
        countsMap.set(row.id, {
          like_count: row.like_count,
          reply_count: row.reply_count,
          repost_count: row.repost_count,
          click_count: row.click_count,
        });
      }
    }

    const authorEngagementCounts = this.computeAuthorAffinities(
      viewerEngagementsResult.data ?? [],
      candidates,
      authorIds
    );

    for (const candidate of candidates) {
      const counts = countsMap.get(candidate.tweet.id);
      if (counts) {
        candidate.tweet.like_count = counts.like_count;
        candidate.tweet.reply_count = counts.reply_count;
        candidate.tweet.repost_count = counts.repost_count;
        candidate.tweet.click_count = counts.click_count;
      }

      const affinity = authorEngagementCounts.get(candidate.tweet.author_id) ?? 0;
      (candidate as ScoredCandidateWithAffinity).viewer_author_affinity = affinity;
    }

    console.log(
      `[RANK] Hydrated ${candidates.length} candidates with engagement data`
    );
    return candidates;
  }

  /**
   * Viewer's engagement ratio per author: (engagements with author) / (total engagements).
   * Requires resolving which tweets belong to which authors via the candidate list.
   */
  private computeAuthorAffinities(
    viewerEngagements: { tweet_id: string }[],
    candidates: ScoredCandidate[],
    authorIds: string[]
  ): Map<string, number> {
    const totalEngagements = viewerEngagements.length;
    if (totalEngagements === 0) {
      return new Map(authorIds.map((id) => [id, 0]));
    }

    const tweetToAuthor = new Map<string, string>();
    for (const candidate of candidates) {
      tweetToAuthor.set(candidate.tweet.id, candidate.tweet.author_id);
    }

    const engagementsPerAuthor = new Map<string, number>();
    for (const authorId of authorIds) {
      engagementsPerAuthor.set(authorId, 0);
    }

    for (const engagement of viewerEngagements) {
      const authorId = tweetToAuthor.get(engagement.tweet_id);
      if (authorId && engagementsPerAuthor.has(authorId)) {
        engagementsPerAuthor.set(
          authorId,
          (engagementsPerAuthor.get(authorId) ?? 0) + 1
        );
      }
    }

    const affinities = new Map<string, number>();
    for (const [authorId, count] of engagementsPerAuthor) {
      affinities.set(authorId, Math.min(count / totalEngagements, 1.0));
    }

    return affinities;
  }
}

export interface ScoredCandidateWithAffinity extends ScoredCandidate {
  viewer_author_affinity: number;
}

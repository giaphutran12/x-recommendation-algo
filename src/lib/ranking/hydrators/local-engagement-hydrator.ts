import type { Hydrator } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import { getLocalDataStore } from '@/lib/local-data';

export class LocalEngagementHydrator implements Hydrator {
  readonly name = 'EngagementHydrator';

  async hydrate(
    query: FeedQuery,
    candidates: ScoredCandidate[]
  ): Promise<ScoredCandidate[]> {
    if (candidates.length === 0) return candidates;

    const store = getLocalDataStore();
    const tweetIds = candidates.map((c) => c.tweet.id);
    const authorIds = [...new Set(candidates.map((c) => c.tweet.author_id))];

    const countsMap = store.getEngagementCountsForTweets(tweetIds);
    const viewerEngagements = store.getViewerEngagements(query.viewer_id);

    const authorEngagementCounts = this.computeAuthorAffinities(
      viewerEngagements,
      candidates,
      authorIds
    );

    console.log(
      `[RANK] Hydrated ${candidates.length} candidates with engagement data (local)`
    );

    return candidates.map((candidate) => {
      const counts = countsMap.get(candidate.tweet.id);
      const updatedTweet = counts
        ? {
            ...candidate.tweet,
            like_count: counts.like_count,
            reply_count: counts.reply_count,
            repost_count: counts.repost_count,
            click_count: counts.click_count,
          }
        : candidate.tweet;

      const affinity = authorEngagementCounts.get(candidate.tweet.author_id) ?? 0;
      return {
        ...candidate,
        tweet: updatedTweet,
        viewer_author_affinity: affinity,
      } as ScoredCandidateWithAffinity;
    });
  }

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

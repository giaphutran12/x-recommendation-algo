import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class RepostDedupFilter implements Filter {
  readonly name = 'RepostDedupFilter';

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const repostGroups = new Map<string, ScoredCandidate[]>();
    const nonReposts: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      if (candidate.tweet.tweet_type === 'repost' && candidate.tweet.quoted_tweet_id) {
        const originalId = candidate.tweet.quoted_tweet_id;
        const group = repostGroups.get(originalId);
        if (group) {
          group.push(candidate);
        } else {
          repostGroups.set(originalId, [candidate]);
        }
      } else {
        nonReposts.push(candidate);
      }
    }

    const keptReposts: ScoredCandidate[] = [];
    for (const group of repostGroups.values()) {
      const best = group.reduce((a, b) =>
        a.author.follower_count >= b.author.follower_count ? a : b
      );
      keptReposts.push(best);
    }

    const result = [...nonReposts, ...keptReposts];
    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

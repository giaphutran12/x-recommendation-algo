import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class SelfTweetFilter implements Filter {
  readonly name = 'SelfTweetFilter';

  filter(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const result = candidates.filter(
      (c) => c.tweet.author_id !== query.viewer_id
    );

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

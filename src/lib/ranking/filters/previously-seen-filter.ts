import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class PreviouslySeenFilter implements Filter {
  readonly name = 'PreviouslySeenFilter';

  filter(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const seenSet = new Set(query.seen_ids);
    const result = candidates.filter((c) => !seenSet.has(c.tweet.id));

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

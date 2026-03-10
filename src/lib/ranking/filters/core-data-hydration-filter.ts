import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class CoreDataHydrationFilter implements Filter {
  readonly name = 'CoreDataHydrationFilter';

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const result = candidates.filter(
      (c) => c.tweet.content && c.author && c.author.id
    );

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

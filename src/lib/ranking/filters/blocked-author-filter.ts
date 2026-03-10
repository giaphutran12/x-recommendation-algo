import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class BlockedAuthorFilter implements Filter {
  readonly name = 'BlockedAuthorFilter';
  private readonly blockedIds: Set<string>;

  constructor(blockedAuthorIds: string[] = []) {
    this.blockedIds = new Set(blockedAuthorIds);
  }

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    if (this.blockedIds.size === 0) {
      console.log(`[RANK] ${this.name}: removed 0 candidates (${candidates.length} remaining)`);
      return candidates;
    }

    const result = candidates.filter((c) => !this.blockedIds.has(c.tweet.author_id));

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

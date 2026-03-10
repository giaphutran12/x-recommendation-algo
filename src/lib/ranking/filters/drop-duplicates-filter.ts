import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class DropDuplicatesFilter implements Filter {
  readonly name = 'DropDuplicatesFilter';

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const seen = new Set<string>();
    const result: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      if (!seen.has(candidate.tweet.id)) {
        seen.add(candidate.tweet.id);
        result.push(candidate);
      }
    }

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

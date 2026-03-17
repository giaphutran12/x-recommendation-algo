import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

const THREE_SIXTY_FIVE_DAYS_MS = 365 * 24 * 60 * 60 * 1000;

export class AgeFilter implements Filter {
  readonly name = 'AgeFilter';
  private readonly maxAgeMs: number;

  constructor(maxAgeMs: number = THREE_SIXTY_FIVE_DAYS_MS) {
    this.maxAgeMs = maxAgeMs;
  }

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const now = Date.now();
    const result = candidates.filter((c) => {
      const tweetAge = now - new Date(c.tweet.created_at).getTime();
      return tweetAge <= this.maxAgeMs;
    });

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

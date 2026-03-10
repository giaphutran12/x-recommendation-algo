import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class MutedKeywordFilter implements Filter {
  readonly name = 'MutedKeywordFilter';
  private readonly keywords: string[];

  constructor(keywords: string[] = []) {
    this.keywords = keywords.map((k) => k.toLowerCase());
  }

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    if (this.keywords.length === 0) {
      console.log(`[RANK] ${this.name}: removed 0 candidates (${candidates.length} remaining)`);
      return candidates;
    }

    const result = candidates.filter((c) => {
      const contentLower = c.tweet.content.toLowerCase();
      return !this.keywords.some((keyword) => contentLower.includes(keyword));
    });

    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

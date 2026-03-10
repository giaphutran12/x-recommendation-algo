// TopKSelector: Picks final candidates with author diversity enforcement
// Ensures no single author dominates the top 20 results (max 3 tweets per author)

import type { Selector } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class TopKSelector implements Selector {
  name = 'TopKSelector';
  private readonly maxAuthorTweetsInTop20 = 3;

  select(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const k = query.limit || 50;
    const totalCandidates = candidates.length;

    // Sort by score descending
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    // Determine the diversity window: min(20, k)
    const diversityWindowSize = Math.min(20, k);

    // Build result with diversity enforcement
    const selected: ScoredCandidate[] = [];
    const authorCounts = new Map<string, number>();
    const skipped: ScoredCandidate[] = [];
    let swapped = 0;

    // First pass: fill diversity window with diversity enforcement
    for (const candidate of sorted) {
      if (selected.length >= diversityWindowSize) break;

      const authorId = candidate.tweet.author_id;
      const count = authorCounts.get(authorId) || 0;

      if (count < this.maxAuthorTweetsInTop20) {
        selected.push(candidate);
        authorCounts.set(authorId, count + 1);
      } else {
        skipped.push(candidate);
      }
    }

    // Second pass: add remaining candidates to reach K (respecting diversity in top 20)
    if (selected.length < k) {
      const selectedSet = new Set(selected);
      for (const candidate of sorted) {
        if (!selectedSet.has(candidate)) {
          // If we're still filling the diversity window, check diversity constraint
          if (selected.length < diversityWindowSize) {
            const authorId = candidate.tweet.author_id;
            const count = authorCounts.get(authorId) || 0;
            if (count < this.maxAuthorTweetsInTop20) {
              selected.push(candidate);
              authorCounts.set(authorId, count + 1);
            }
          } else {
            // After diversity window, add freely
            selected.push(candidate);
          }

          if (selected.length >= k) break;
        }
      }
    }

    console.log(
      `[RANK] Selected top ${k} from ${totalCandidates} candidates (${swapped} diversity swaps)`
    );

    return selected;
  }
}

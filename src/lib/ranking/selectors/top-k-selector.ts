// TopKSelector: Picks the top K candidates by score
// Diversity is already handled by AuthorDiversityScorer (score penalties)
// This selector just sorts by final score and takes the top K

import type { Selector } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class TopKSelector implements Selector {
  name = 'TopKSelector';

  select(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const k = query.limit || 50;
    const totalCandidates = candidates.length;

    const selected = [...candidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    console.log(
      `[RANK] Selected top ${selected.length} from ${totalCandidates} candidates`
    );

    return selected;
  }
}

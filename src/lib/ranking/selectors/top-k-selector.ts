import type { Selector } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

const DEFAULT_DECAY = 0.5;
const FLOOR = 0.1;

export class TopKSelector implements Selector {
  name = 'TopKSelector';

  select(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const k = query.limit || 50;
    const totalCandidates = candidates.length;
    const decay = query.algorithm_weights.diversity_decay ?? DEFAULT_DECAY;

    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    const authorAppearances = new Map<string, number>();
    let penalizedCount = 0;

    const diversified = sorted.map((candidate) => {
      const authorId = candidate.author.id;
      const position = authorAppearances.get(authorId) ?? 0;
      authorAppearances.set(authorId, position + 1);

      if (position === 0) {
        return candidate;
      }

      penalizedCount++;
      const multiplier = (1 - FLOOR) * Math.pow(decay, position) + FLOOR;
      const newScore = candidate.score * multiplier;

      return {
        ...candidate,
        score: newScore,
        explanation: candidate.explanation
          ? {
              ...candidate.explanation,
              authorDiversityMultiplier: multiplier,
              totalScore: newScore,
            }
          : null,
      };
    });

    const selected = diversified
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    console.log(
      `[RANK] Author diversity: penalized ${penalizedCount} candidates from repeated authors`,
    );
    console.log(
      `[RANK] Selected top ${selected.length} from ${totalCandidates} candidates`,
    );
    console.log(
      `[RANK] Top 5 final order: ${selected.slice(0, 5).map((c, i) => `${i + 1}. @${c.author.username} score=${c.score.toFixed(4)} div=${c.explanation?.authorDiversityMultiplier.toFixed(2)}`).join(' | ')}`,
    );

    return selected;
  }
}

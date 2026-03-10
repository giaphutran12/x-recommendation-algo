import type { Scorer } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

const DEFAULT_OON_PENALTY = 0.7;

export const OutOfNetworkScorer: Scorer = {
  name: 'OutOfNetworkScorer',

  async score(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]> {
    const factor = query.algorithm_weights.oon_penalty ?? DEFAULT_OON_PENALTY;
    let penalizedCount = 0;

    const result = candidates.map((candidate) => {
      if (candidate.in_network) {
        return candidate;
      }

      penalizedCount++;
      const newScore = candidate.score * factor;

      return {
        ...candidate,
        score: newScore,
        explanation: candidate.explanation
          ? {
              ...candidate.explanation,
              oonMultiplier: factor,
              totalScore: newScore,
            }
          : null,
      };
    });

    console.log(
      `[RANK] OON scorer: penalized ${penalizedCount} out-of-network candidates by ${factor}x`,
    );

    return result;
  },
};

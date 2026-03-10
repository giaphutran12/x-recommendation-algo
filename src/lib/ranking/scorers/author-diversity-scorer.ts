import type { Scorer } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

const DECAY = 0.5;
const FLOOR = 0.1;

export const AuthorDiversityScorer: Scorer = {
  name: 'AuthorDiversityScorer',

  async score(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]> {
    const sorted = [...candidates].sort((a, b) => b.score - a.score);

    const authorAppearances = new Map<string, number>();
    let penalizedCount = 0;
    const decay = query.algorithm_weights.diversity_decay ?? DECAY;

    const result = sorted.map((candidate) => {
      const authorId = candidate.author.id;
      const position = authorAppearances.get(authorId) ?? 0;
      authorAppearances.set(authorId, position + 1);

      if (position === 0) {
        return candidate;
      }

      penalizedCount++;
      // Exponential decay: multiplier approaches FLOOR as repeats increase
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

    console.log(
      `[RANK] Author diversity: penalized ${penalizedCount} candidates from repeated authors`,
    );

    return result;
  },
};

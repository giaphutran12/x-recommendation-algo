import type { Scorer } from '@/lib/types/pipeline';
import { EngagementPredictor } from './engagement-predictor';
import { WeightedScorer } from './weighted-scorer';
import { AuthorDiversityScorer } from './author-diversity-scorer';
import { OutOfNetworkScorer } from './oon-scorer';

export { EngagementPredictor } from './engagement-predictor';
export { WeightedScorer } from './weighted-scorer';
export { AuthorDiversityScorer } from './author-diversity-scorer';
export { OutOfNetworkScorer } from './oon-scorer';

export function createScorerChain(): Scorer[] {
  return [EngagementPredictor, WeightedScorer, AuthorDiversityScorer, OutOfNetworkScorer];
}

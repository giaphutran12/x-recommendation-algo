import type { Scorer } from '@/lib/types/pipeline';
import { EngagementPredictor } from './engagement-predictor';
import { WeightedScorer } from './weighted-scorer';
import { OutOfNetworkScorer } from './oon-scorer';

export { EngagementPredictor } from './engagement-predictor';
export { WeightedScorer } from './weighted-scorer';
export { OutOfNetworkScorer } from './oon-scorer';

export function createScorerChain(): Scorer[] {
  return [EngagementPredictor, WeightedScorer, OutOfNetworkScorer];
}

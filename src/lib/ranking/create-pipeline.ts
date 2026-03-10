import type { SupabaseClient } from '@supabase/supabase-js';
import { RankingPipeline } from './pipeline';
import { InNetworkSource, OutOfNetworkSource } from './sources';
import { EngagementHydrator } from './hydrators';
import { createFilterChain } from './filters';
import { createScorerChain } from './scorers';
import { TopKSelector } from './selectors';

export function createDefaultPipeline(supabase: SupabaseClient): RankingPipeline {
  return new RankingPipeline(
    [new InNetworkSource(supabase), new OutOfNetworkSource(supabase)],
    [new EngagementHydrator(supabase)],
    createFilterChain(),
    createScorerChain(),
    [new TopKSelector()],
  );
}

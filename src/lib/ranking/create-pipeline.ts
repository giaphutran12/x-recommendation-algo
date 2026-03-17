import type { SupabaseClient } from '@supabase/supabase-js';
import { RankingPipeline } from './pipeline';
import { InNetworkSource, OutOfNetworkSource } from './sources';
import { EngagementHydrator } from './hydrators';
import { createFilterChain } from './filters';
import { createScorerChain } from './scorers';
import { TopKSelector } from './selectors';
import { LocalInNetworkSource } from './sources/local-in-network-source';
import { LocalOutOfNetworkSource } from './sources/local-out-of-network-source';
import { LocalEngagementHydrator } from './hydrators/local-engagement-hydrator';

export function createDefaultPipeline(supabase: SupabaseClient): RankingPipeline {
  return new RankingPipeline(
    [new InNetworkSource(supabase), new OutOfNetworkSource(supabase)],
    [new EngagementHydrator(supabase)],
    createFilterChain(),
    createScorerChain(),
    [new TopKSelector()],
  );
}

export function createLocalPipeline(): RankingPipeline {
  return new RankingPipeline(
    [new LocalInNetworkSource(), new LocalOutOfNetworkSource()],
    [new LocalEngagementHydrator()],
    createFilterChain(),
    createScorerChain(),
    [new TopKSelector()],
  );
}

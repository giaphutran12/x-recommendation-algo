import type { CandidateSource, Hydrator, Filter, Scorer, Selector } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class RankingPipeline {
  constructor(
    private sources: CandidateSource[],
    private hydrators: Hydrator[],
    private filters: Filter[],
    private scorers: Scorer[],
    private selectors: Selector[],
  ) {}

  async execute(query: FeedQuery): Promise<ScoredCandidate[]> {
    const startTime = Date.now();

    // 1. Retrieve from all sources in parallel
    const sourceResults = await Promise.all(
      this.sources.map(async (source) => {
        const start = Date.now();
        const candidates = await source.retrieve(query);
        console.log(`[RANK] Pipeline stage ${source.name}: ${Date.now() - start}ms (${candidates.length} candidates)`);
        return candidates;
      })
    );
    let candidates = sourceResults.flat();
    const inputCount = candidates.length;

    // 2. Hydrate sequentially
    for (const hydrator of this.hydrators) {
      const start = Date.now();
      candidates = await hydrator.hydrate(query, candidates);
      console.log(`[RANK] Pipeline stage ${hydrator.name}: ${Date.now() - start}ms (${candidates.length} candidates)`);
    }

    // 3. Filter sequentially
    for (const filter of this.filters) {
      candidates = filter.filter(query, candidates);
    }

    // 4. Score sequentially
    for (const scorer of this.scorers) {
      const start = Date.now();
      candidates = await scorer.score(query, candidates);
      console.log(`[RANK] Pipeline stage ${scorer.name}: ${Date.now() - start}ms (${candidates.length} candidates)`);
    }

    // 5. Select
    for (const selector of this.selectors) {
      candidates = selector.select(query, candidates);
    }

    console.log(`[RANK] Pipeline complete: ${Date.now() - startTime}ms, ${inputCount} → ${candidates.length} candidates`);
    return candidates;
  }
}

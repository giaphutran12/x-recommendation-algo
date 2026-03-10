// Pipeline interfaces mirroring X's candidate-pipeline architecture
// Source → Hydrator → Filter → Scorer → Selector

import type { FeedQuery, ScoredCandidate } from './ranking';

export interface CandidateSource {
  name: string;
  retrieve(query: FeedQuery): Promise<ScoredCandidate[]>;
}

export interface Hydrator {
  name: string;
  hydrate(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]>;
}

export interface Filter {
  name: string;
  filter(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[];
}

export interface Scorer {
  name: string;
  score(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]>;
}

export interface Selector {
  name: string;
  select(query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[];
}

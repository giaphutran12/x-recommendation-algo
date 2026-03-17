# Local Data Fallback — Feed Works Without Supabase

## TL;DR

> **Quick Summary**: Add graceful fallback so the feed pipeline works from local JSON files when Supabase is unavailable (DB deleted). Export current DB data, create local source/hydrator implementations, wire into pipeline with automatic detection.
> 
> **Deliverables**:
> - Export script that dumps Supabase data to `src/lib/data/*.json`
> - `LocalDataStore` singleton that loads JSON into memory
> - Local implementations of InNetworkSource, OutOfNetworkSource, EngagementHydrator
> - Pipeline factory that auto-detects Supabase availability
> - Feed route that falls back gracefully
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Tasks 3-5 (parallel) → Tasks 6-8,10 (parallel) → Task 9 → Task 11

---

## Context

### Original Request
User wants the feed to keep working after deleting the Supabase database. The app should fall back to pre-exported local JSON data files.

### Key Constraints
- Embeddings are 732MB as JSON — TOO LARGE for GitHub. OON source uses popularity fallback instead.
- Tweet batch files (12MB) already exist in `src/lib/seed/generated/`
- Engagement records (338K) ≈ 27MB — pushable to GitHub
- Total local data ≈ 43MB — within GitHub limits
- Data files go in `src/lib/data/` and ARE tracked in git (they ARE the fallback)

---

## Work Objectives

### Core Objective
When Supabase env vars are missing or DB is unreachable, the feed pipeline automatically uses local JSON data files instead.

### Concrete Deliverables
- `src/lib/seed/export-local.ts` — export script
- `src/lib/local-data.ts` — singleton data store
- `src/lib/ranking/sources/local-in-network-source.ts`
- `src/lib/ranking/sources/local-out-of-network-source.ts`
- `src/lib/ranking/hydrators/local-engagement-hydrator.ts`
- Updated `src/lib/ranking/create-pipeline.ts`
- Updated `src/lib/supabase/server.ts`
- Updated `src/app/api/feed/route.ts`
- Updated barrel exports and package.json

### Must Have
- Feed returns ranked tweets when Supabase is completely gone
- Same filters, scorers, selectors work on local data
- Engagement predictor heuristic fallback works (already exists)
- Export script runs before DB deletion

### Must NOT Have (Guardrails)
- No embedding-based OON retrieval in local mode (732MB too large)
- No comments or docstrings in new code
- No changes to existing Supabase-based sources (keep them untouched)
- No storing embeddings locally

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: Tests-after (verify existing tests still pass)
- **Framework**: vitest via `bun test`

### QA Policy
Every task includes agent-executed QA. Evidence saved to `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: Export script [quick]
├── Task 2: LocalDataStore singleton [deep]

Wave 2 (Local sources — parallel, all depend on Task 2):
├── Task 3: LocalInNetworkSource [quick]
├── Task 4: LocalOutOfNetworkSource [quick]
├── Task 5: LocalEngagementHydrator [quick]

Wave 3 (Wiring + UI — parallel, depend on Tasks 3-5):
├── Task 6: Update create-pipeline.ts [quick]
├── Task 7: Update supabase/server.ts [quick]
├── Task 8: Update feed route + barrel exports + package.json [quick]
├── Task 10: Show "local data" banner in Feed UI [quick]

Wave 4 (Verify):
├── Task 9: Run export script to generate data files [quick]
├── Task 11: QA — tests + diagnostics [quick]
```

---

## TODOs

- [ ] 1. Create export script (`src/lib/seed/export-local.ts`)

  **What to do**:
  - Create `src/lib/seed/export-local.ts` that connects to Supabase (service role key) and exports 4 tables to `src/lib/data/*.json`
  - Export: `users` (all columns except embedding), `follows`, `tweets` (all columns EXCEPT `embedding`), `engagements`
  - Paginate large tables with `.range(from, to)` in batches of 5000 (tweets: 50K rows = 10 batches, engagements: 338K = 68 batches)
  - Use `Bun.write()` + `JSON.stringify()` for file output
  - Create `src/lib/data/` dir with `mkdirSync({ recursive: true })`
  - Log progress per batch: `[EXPORT] Exporting tweets... 5000 rows`, etc.
  - Log final file sizes
  - Add `"export-local": "bun run src/lib/seed/export-local.ts"` to package.json scripts
  - Use same Supabase client pattern as `src/lib/seed/index.ts` lines 43-50

  **Must NOT do**:
  - No comments or docstrings
  - Do NOT export the `embedding` column from tweets (too large)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:
  - `src/lib/seed/index.ts:43-54` — Supabase client creation pattern (createClient with service role key, persistSession: false)
  - `src/lib/types/database.ts` — Tweet, User, Follow, Engagement interfaces define the exact fields to export
  - `package.json:6-14` — existing scripts section, add `export-local` after `test:watch`

  **Acceptance Criteria**:
  - [ ] Script runs with `bun run export-local` and creates 4 files in `src/lib/data/`
  - [ ] `users.json` contains ~201 user records
  - [ ] `tweets.json` contains ~50K records WITHOUT embedding field
  - [ ] `follows.json` contains follow relationships
  - [ ] `engagements.json` contains ~338K engagement records

  **QA Scenarios**:
  ```
  Scenario: Export script creates all data files
    Tool: Bash
    Steps:
      1. Run `bun run export-local`
      2. Check `ls -la src/lib/data/` shows 4 .json files
      3. Run `node -e "console.log(JSON.parse(require('fs').readFileSync('src/lib/data/users.json')).length)"` — expect ~201
      4. Run `node -e "const t=JSON.parse(require('fs').readFileSync('src/lib/data/tweets.json'));console.log(t.length, t[0].embedding)"` — expect ~50000 and undefined
    Expected Result: 4 files exist, correct row counts, no embedding field on tweets
    Evidence: .sisyphus/evidence/task-1-export.txt
  ```

  **Commit**: YES (groups with all tasks)

- [ ] 2. Create LocalDataStore singleton (`src/lib/local-data.ts`)

  **What to do**:
  - Create `src/lib/local-data.ts` — singleton that lazily loads JSON files from `src/lib/data/` into memory
  - Data structures: `users: Map<string, User>`, `tweets: Tweet[]`, `tweetMap: Map<string, Tweet>`, `follows: Follow[]`, `engagements: Engagement[]`
  - Query methods:
    - `getFollowedIds(viewerId: string): string[]` — filter follows where follower_id matches
    - `getTweetsByAuthors(authorIds: string[], cutoffDate: Date, limit: number): Tweet[]` — filter by author_id IN authorIds AND created_at >= cutoff, sort by created_at DESC, take limit
    - `getTweetsByPopularity(excludeAuthorIds: string[], cutoffDate: Date, limit: number): Tweet[]` — filter by author_id NOT IN excludeAuthorIds AND created_at >= cutoff, sort by like_count DESC, take limit
    - `getEngagementCountsForTweets(tweetIds: string[]): Map<string, {like_count, reply_count, repost_count, click_count}>` — lookup from tweetMap
    - `getViewerEngagements(viewerId: string): {tweet_id: string}[]` — filter engagements where user_id matches
    - `getUser(id: string): User | undefined` — lookup from users Map
  - Load files with `readFileSync` from `fs` + `JSON.parse`
  - File paths: `path.join(process.cwd(), 'src/lib/data/users.json')` etc.
  - Log on first load: `[LOCAL] Loaded N users, N tweets, N follows, N engagements`
  - Singleton: `let instance: LocalDataStore | null = null; export function getLocalDataStore(): LocalDataStore`

  **Must NOT do**:
  - No comments or docstrings
  - Do NOT load embeddings

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: None (file can be created before data files exist — loading is lazy)

  **References**:
  - `src/lib/types/database.ts` — Tweet, User, Follow, Engagement type definitions
  - `src/lib/ranking/sources/in-network-source.ts:30-41` — query pattern to replicate (filter by author_id, gte created_at, order desc, limit)
  - `src/lib/ranking/sources/out-of-network-source.ts:112-125` — popularity query pattern (not in author_ids, gte created_at, order by like_count desc)
  - `src/lib/ranking/hydrators/engagement-hydrator.ts:19-29` — engagement query patterns to replicate

  **Acceptance Criteria**:
  - [ ] File exports `getLocalDataStore()` function
  - [ ] All 6 query methods return correct types
  - [ ] Singleton pattern: calling `getLocalDataStore()` twice returns same instance
  - [ ] LSP diagnostics: 0 errors

  **QA Scenarios**:
  ```
  Scenario: LocalDataStore loads and queries correctly
    Tool: Bash
    Steps:
      1. Run lsp_diagnostics on src/lib/local-data.ts — expect 0 errors
      2. Verify types match by checking imports compile
    Expected Result: Clean TypeScript, correct types
    Evidence: .sisyphus/evidence/task-2-local-data.txt
  ```

  **Commit**: YES (groups with all tasks)

- [ ] 3. Create LocalInNetworkSource (`src/lib/ranking/sources/local-in-network-source.ts`)

  **What to do**:
  - Implements `CandidateSource` interface from `@/lib/types/pipeline`
  - Constants: `IN_NETWORK_TIME_WINDOW_HOURS = 8760` (365 days), `IN_NETWORK_MAX_CANDIDATES = 200`
  - `retrieve(query: FeedQuery)` logic:
    1. `const store = getLocalDataStore()`
    2. `const followedIds = store.getFollowedIds(query.viewer_id)`
    3. If empty, log and return []
    4. Compute cutoff: `new Date(Date.now() - IN_NETWORK_TIME_WINDOW_HOURS * 60 * 60 * 1000)`
    5. `const tweets = store.getTweetsByAuthors(followedIds, cutoff, IN_NETWORK_MAX_CANDIDATES)`
    6. Map to `ScoredCandidate[]`: for each tweet, `store.getUser(tweet.author_id)` for author, set `in_network: true, score: 0, engagement_predictions: null, explanation: null`
    7. Filter out candidates where author is undefined
    8. Log: `[RANK] In-network source (local): retrieved ${candidates.length} candidates from ${followedIds.length} followed accounts`
  - Update `src/lib/ranking/sources/index.ts` to add: `export { LocalInNetworkSource } from './local-in-network-source';`

  **Must NOT do**:
  - No comments or docstrings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2

  **References**:
  - `src/lib/ranking/sources/in-network-source.ts` — original implementation to mirror (same logic, local data instead of Supabase)
  - `src/lib/types/pipeline.ts:6-9` — CandidateSource interface
  - `src/lib/types/ranking.ts:34-41` — ScoredCandidate interface
  - `src/lib/local-data.ts` — getLocalDataStore() (created in Task 2)

  **Acceptance Criteria**:
  - [ ] Implements CandidateSource interface
  - [ ] LSP diagnostics: 0 errors
  - [ ] Exported from sources/index.ts

  **Commit**: YES (groups with all tasks)

- [ ] 4. Create LocalOutOfNetworkSource (`src/lib/ranking/sources/local-out-of-network-source.ts`)

  **What to do**:
  - Implements `CandidateSource` interface
  - Constants: `OON_TIME_WINDOW_HOURS = 8760`, `OON_MAX_CANDIDATES = 100`
  - Popularity-only (no embeddings). `retrieve(query: FeedQuery)` logic:
    1. `const store = getLocalDataStore()`
    2. `const followedIds = store.getFollowedIds(query.viewer_id)`
    3. `const excludedIds = [query.viewer_id, ...followedIds]`
    4. Compute cutoff
    5. `const tweets = store.getTweetsByPopularity(excludedIds, cutoff, OON_MAX_CANDIDATES)`
    6. Map to `ScoredCandidate[]` with `in_network: false`
    7. Log: `[RANK] Out-of-network source (local): retrieved ${candidates.length} candidates via popularity`
  - Update `src/lib/ranking/sources/index.ts` to add: `export { LocalOutOfNetworkSource } from './local-out-of-network-source';`

  **Must NOT do**:
  - No embedding search at all
  - No comments or docstrings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2

  **References**:
  - `src/lib/ranking/sources/out-of-network-source.ts:112-139` — popularity fallback logic to mirror
  - `src/lib/types/pipeline.ts:6-9` — CandidateSource interface

  **Acceptance Criteria**:
  - [ ] Implements CandidateSource interface
  - [ ] Uses popularity-only (no embedding/vector code)
  - [ ] LSP diagnostics: 0 errors

  **Commit**: YES (groups with all tasks)

- [ ] 5. Create LocalEngagementHydrator (`src/lib/ranking/hydrators/local-engagement-hydrator.ts`)

  **What to do**:
  - Implements `Hydrator` interface from `@/lib/types/pipeline`
  - `hydrate(query: FeedQuery, candidates: ScoredCandidate[])` logic:
    1. If candidates empty, return early
    2. `const store = getLocalDataStore()`
    3. Get engagement counts: `store.getEngagementCountsForTweets(tweetIds)` — update tweet like/reply/repost/click counts
    4. Get viewer engagements: `store.getViewerEngagements(query.viewer_id)`
    5. Compute author affinities (SAME algorithm as `engagement-hydrator.ts` lines 86-121):
       - Build `tweetToAuthor` map from candidates
       - Count engagements per author
       - Divide by total engagements, cap at 1.0
    6. Return candidates with updated counts and `viewer_author_affinity`
    7. Log: `[RANK] Hydrated ${candidates.length} candidates with engagement data (local)`
  - Export `ScoredCandidateWithAffinity` type (same shape as original)
  - Update `src/lib/ranking/hydrators/index.ts` to add: `export { LocalEngagementHydrator } from './local-engagement-hydrator';`

  **Must NOT do**:
  - No comments or docstrings
  - Do NOT duplicate the existing docstring from engagement-hydrator.ts line 82-85

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2

  **References**:
  - `src/lib/ranking/hydrators/engagement-hydrator.ts` — ENTIRE FILE is the reference. Mirror the exact logic but using LocalDataStore instead of Supabase
  - `src/lib/ranking/hydrators/engagement-hydrator.ts:86-121` — computeAuthorAffinities algorithm (copy this exactly)
  - `src/lib/ranking/hydrators/engagement-hydrator.ts:125-127` — ScoredCandidateWithAffinity type to re-export
  - `src/lib/types/pipeline.ts:11-13` — Hydrator interface

  **Acceptance Criteria**:
  - [ ] Implements Hydrator interface
  - [ ] Author affinity calculation matches original
  - [ ] LSP diagnostics: 0 errors

  **Commit**: YES (groups with all tasks)

- [ ] 6. Update `src/lib/ranking/create-pipeline.ts` — add createLocalPipeline

  **What to do**:
  - Add imports for LocalInNetworkSource, LocalOutOfNetworkSource, LocalEngagementHydrator
  - Add new exported function `createLocalPipeline()` that returns a RankingPipeline with local sources
  - Keep existing `createDefaultPipeline(supabase)` COMPLETELY UNCHANGED
  - The local pipeline uses same filters, scorers, selectors — only sources and hydrators differ

  **Current file content** (for reference):
  ```
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
  ```

  **Add after existing function**:
  ```typescript
  import { LocalInNetworkSource } from './sources/local-in-network-source';
  import { LocalOutOfNetworkSource } from './sources/local-out-of-network-source';
  import { LocalEngagementHydrator } from './hydrators/local-engagement-hydrator';

  export function createLocalPipeline(): RankingPipeline {
    return new RankingPipeline(
      [new LocalInNetworkSource(), new LocalOutOfNetworkSource()],
      [new LocalEngagementHydrator()],
      createFilterChain(),
      createScorerChain(),
      [new TopKSelector()],
    );
  }
  ```
  (Put new imports at top with existing imports)

  **Must NOT do**:
  - Do NOT modify existing createDefaultPipeline function

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 3, 4, 5

  **References**:
  - `src/lib/ranking/create-pipeline.ts` — current file (shown above)

  **Acceptance Criteria**:
  - [ ] `createLocalPipeline()` is exported
  - [ ] Existing `createDefaultPipeline` is unchanged
  - [ ] LSP diagnostics: 0 errors

  **Commit**: YES (groups with all tasks)

- [ ] 7. Update `src/lib/supabase/server.ts` — graceful null when env vars missing

  **What to do**:
  - Replace the current content that throws errors with a version that exports `null` when env vars are missing

  **Current file** (REPLACE ENTIRELY):
  ```typescript
  import { createClient } from '@supabase/supabase-js';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!anonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  export const supabase = createClient(url, anonKey);
  ```

  **New content**:
  ```typescript
  import { createClient, type SupabaseClient } from '@supabase/supabase-js';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  export const supabase: SupabaseClient | null =
    url && anonKey ? createClient(url, anonKey) : null;
  ```

  **Must NOT do**:
  - No error logging, no comments — just silent null

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: Task 8
  - **Blocked By**: None (but logically groups with Wave 3)

  **References**:
  - `src/lib/supabase/server.ts` — current file shown above

  **IMPORTANT**: Check ALL other files that import `supabase` from this module. They currently expect `SupabaseClient`, not `SupabaseClient | null`. The feed route (Task 8) handles this, but check for other importers:
  - `src/app/api/feed/route.ts` — handled in Task 8
  - `src/app/api/weights/route.ts` — may need null check
  - `src/app/api/seed/route.ts` — may need null check
  - Search with: `grep -r "from '@/lib/supabase/server'" src/`

  **Acceptance Criteria**:
  - [ ] `supabase` export type is `SupabaseClient | null`
  - [ ] No throws on missing env vars
  - [ ] All importers handle null (check with grep)
  - [ ] LSP diagnostics: 0 errors across ALL files importing this module

  **Commit**: YES (groups with all tasks)

- [ ] 8. Update feed route + barrel exports + package.json

  **What to do**:

  **8a. `src/app/api/feed/route.ts`** — 3 surgical edits:
  
  Edit 1 — import line 3: 
  Change: `import { createDefaultPipeline } from '@/lib/ranking/create-pipeline';`
  To: `import { createDefaultPipeline, createLocalPipeline } from '@/lib/ranking/create-pipeline';`

  Edit 2 — lines 37-41 (weights query):
  Change:
  ```typescript
       const { data: weights } = await supabase
         .from('algorithm_weights')
         .select('*')
         .eq('user_id', userId)
         .maybeSingle();
  ```
  To:
  ```typescript
      const weights = supabase
        ? (await supabase.from('algorithm_weights').select('*').eq('user_id', userId).maybeSingle()).data
        : null;
  ```

  Edit 3 — line 56, replace `const pipeline = createDefaultPipeline(supabase);` with:
  ```typescript
      const isLocal = !supabase;
      if (isLocal) {
        console.log('[FEED] Supabase unavailable — using local data fallback (DB was removed to free up Supabase free tier slots, shipping too many projects)');
      }
      const pipeline = isLocal ? createLocalPipeline() : createDefaultPipeline(supabase);
  ```

  Edit 4 — in the response JSON (around line 69), add `dataSource` to `meta`:
  Change:
  ```typescript
        meta: {
          totalCandidates: results.length,
          pipelineMs,
          appliedWeights,
        },
  ```
  To:
  ```typescript
        meta: {
          totalCandidates: results.length,
          pipelineMs,
          appliedWeights,
          dataSource: isLocal ? 'local' : 'supabase',
        },
  ```

  **8b. `src/lib/ranking/sources/index.ts`** — add 2 export lines:
  ```typescript
  export { LocalInNetworkSource } from './local-in-network-source';
  export { LocalOutOfNetworkSource } from './local-out-of-network-source';
  ```

  **8c. `src/lib/ranking/hydrators/index.ts`** — add 1 export line:
  ```typescript
  export { LocalEngagementHydrator } from './local-engagement-hydrator';
  ```

  **8d. `package.json`** — add script after line 13 (`"test:watch": "vitest"`):
  ```json
  "export-local": "bun run src/lib/seed/export-local.ts",
  ```

  **8e. Check other Supabase importers** (from Task 7's note):
  - Run `grep -r "from '@/lib/supabase/server'" src/` to find ALL importers
  - For each file that uses `supabase` directly (not just passing it), add null checks
  - `src/app/api/weights/route.ts` — wrap Supabase calls: `if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });`
  - `src/app/api/seed/route.ts` — same pattern

  **Must NOT do**:
  - Do NOT change any other logic in the feed route

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 3, 4, 5, 7

  **References**:
  - `src/app/api/feed/route.ts` — current file (read earlier in conversation)
  - `src/lib/ranking/sources/index.ts` — current: 2 export lines
  - `src/lib/ranking/hydrators/index.ts` — current: 4 export lines
  - `package.json:6-14` — scripts section

  **Acceptance Criteria**:
  - [ ] Feed route compiles with null supabase
  - [ ] All barrel exports include local implementations
  - [ ] `bun run export-local` script is available
  - [ ] All Supabase importers handle null
  - [ ] LSP diagnostics: 0 errors on all changed files

  **Commit**: YES (groups with all tasks)

- [ ] 9. Run export script to generate local data files

  **What to do**:
  - Run `bun run export-local` to dump current Supabase data to `src/lib/data/`
  - Verify all 4 files are created with correct sizes
  - Ensure `src/lib/data/` is NOT in `.gitignore` (files must be tracked in git)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `src/lib/data/users.json` exists (~201 records)
  - [ ] `src/lib/data/tweets.json` exists (~50K records, no embedding field)
  - [ ] `src/lib/data/follows.json` exists
  - [ ] `src/lib/data/engagements.json` exists (~338K records)
  - [ ] Total size < 60MB

  **Commit**: YES (groups with all tasks)

- [ ] 10. Show "local data" banner in Feed UI (`src/app/(main)/_components/feed.tsx`)

  **What to do**:

  **10a. Update `FeedMeta` interface** — add `dataSource` field:
  ```typescript
  interface FeedMeta {
    totalCandidates: number;
    pipelineMs: number;
    appliedWeights: Record<string, number>;
    dataSource?: 'supabase' | 'local';
  }
  ```

  **10b. Track `dataSource` in state** — add state after `hasMore`:
  ```typescript
  const [dataSource, setDataSource] = useState<string | null>(null);
  ```
  In `fetchFeed`, after `const data: FeedResponse = await res.json();` add:
  ```typescript
  if (data.meta?.dataSource) setDataSource(data.meta.dataSource);
  ```

  **10c. Add banner** — at the top of the return JSX, right after `<div className="relative bg-background">`, add:
  ```tsx
  {dataSource === 'local' && (
    <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
      <span>Running on local data — Supabase DB was freed up (only 2 free tier slots, shipping too many projects)</span>
    </div>
  )}
  ```
  Uses inline SVG for the database icon (lucide `Database` icon) since this is a one-off indicator. Amber color matches warning/info tone without being alarming.

  **Must NOT do**:
  - Do NOT use `lucide-react` import for a single icon in a banner (inline SVG is fine for a one-off)
  - Actually — correction: per AGENTS.md "Use lucide-react for ALL icons". So use: `import { Database } from 'lucide-react'` and `<Database className="size-3.5 shrink-0" />`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 8 (needs the API to return `dataSource`)

  **References**:
  - `src/app/(main)/_components/feed.tsx` — full file (145 lines, read above)
  - `src/app/(main)/_components/feed.tsx:10-14` — FeedMeta interface to update
  - `src/app/(main)/_components/feed.tsx:101-102` — JSX insertion point for banner
  - `src/components/ui/badge.tsx` — available but a simple div is cleaner here

  **Acceptance Criteria**:
  - [ ] FeedMeta includes `dataSource` field
  - [ ] Banner appears when `dataSource === 'local'`
  - [ ] Banner is amber-toned, subtle, shows database icon + message
  - [ ] Banner does NOT appear when using Supabase
  - [ ] LSP diagnostics: 0 errors

  **Commit**: YES (groups with all tasks)

- [ ] 11. QA — tests + LSP diagnostics

  **What to do**:
  - Run `bun test` — expect 77 pass, 5 pre-existing fail (0 new failures)
  - Run `lsp_diagnostics` on ALL new and modified files
  - Verify feed response includes `meta.dataSource` field
  - Verify feed works: `curl -X POST http://localhost:3000/api/feed -H 'Content-Type: application/json' -d '{"limit":5}'`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: All previous tasks

  **Acceptance Criteria**:
  - [ ] `bun test`: 77 pass, 5 pre-existing fail
  - [ ] 0 LSP errors on new/modified files
  - [ ] Feed endpoint returns ranked tweets with `meta.dataSource`
  - [ ] UI shows amber banner when in local mode

  **Commit**: Final commit + push

---

## Final Verification Wave

- [ ] F1. **Existing tests pass** — `bun test` shows same 77 pass / 5 pre-existing fail
- [ ] F2. **LSP clean** — `lsp_diagnostics` on all new/changed files shows 0 errors
- [ ] F3. **Export runs** — `bun run export-local` produces 4 JSON files in `src/lib/data/`
- [ ] F4. **Local pipeline works** — Remove Supabase env vars, hit feed endpoint, get ranked tweets

---

## Commit Strategy

- Single commit: `feat: add local data fallback for offline feed when Supabase is unavailable`
- Files: all new + modified files listed above
- Pre-commit: `bun test`

---

## Success Criteria

### Verification Commands
```bash
bun test  # Expected: 77 pass, 5 pre-existing fail (0 regressions)
bun run export-local  # Expected: 4 JSON files created in src/lib/data/
```

### Final Checklist
- [ ] Feed works with Supabase (existing behavior unchanged)
- [ ] Feed works WITHOUT Supabase (local fallback)
- [ ] Export script creates all 4 data files
- [ ] All existing tests pass

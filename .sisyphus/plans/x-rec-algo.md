# X Recommendation Algorithm — Full-Stack Reimplementation

## TL;DR

> **Quick Summary**: Build a personalized reimplementation of X's "For You" feed algorithm as a full-stack web app. The system exposes the full ranking pipeline (Retrieve → Hydrate → Filter → Score → Select) as a tunable, inspectable engine with user-facing sliders, score breakdowns, and a synthetic social network of LLM-generated personas.
> 
> **Deliverables**:
> - TypeScript ranking pipeline mirroring X's architecture (6 engagement signals, 10 filters, 4 sequential scorers)
> - Two-Tower neural network trained in PyTorch, exported to ONNX, inference in TypeScript via onnxruntime-node
> - Text embeddings (Gemini embedding-001, 1536-dim via Matryoshka) + pgvector for out-of-network retrieval
> - Synthetic social network seed script (200 LLM personas, ~50K tweets, realistic follow graph)
> - Next.js 16 (App Router) web app: feed, profiles, follow graph, algorithm control panel, explainability
> - SSE-powered live feed re-ranking when user adjusts algorithm weights
> - YouTube demo video showcasing tunable algorithm
> 
> **Estimated Effort**: Large (5-7 weeks solo)
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Scaffolding → DB Schema → Ranking Pipeline → Seed Script → UI + Controls

---

## Context

### Original Request
Build a personalized reimplementation of the X recommendation algorithm based on the open-sourced `xai-org/x-algorithm` repository. The system should be a tunable, inspectable, user-programmable ranking engine with a synthetic social network and full X-like web UI.

### Interview Summary
**Key Discussions**:
- User understands the full X algorithm architecture (Retrieve → Hydrate → Filter → Score → Select)
- User confirmed: study the blueprint, build own version — NOT fork X's code
- User has built "Twitter for stocks" before but never a recommendation algorithm
- Candidate isolation principle understood: score each tweet independently against user context
- Two-source retrieval understood: in-network (followed accounts) + out-of-network (algorithmic discovery)
- Weighted scoring formula understood: `Σ(weight_i × P(action_i))` with positive/negative weights

**Research Findings**:
- X's repo: 79 files, 4 modules (candidate-pipeline, home-mixer, thunder, phoenix) in Rust + Python/JAX
- Phoenix predicts 19 engagement types; we'll implement 6 core ones as heuristic formulas
- Google ML docs confirm universal 3-stage pattern: Candidate Generation → Scoring → Re-ranking
- Author diversity uses exponential decay: `multiplier = (1 - floor) × decay^position + floor`
- OON (out-of-network) scoring applies multiplicative penalty factor
- Synthetic network research: TWICE framework for tweet generation, Barabási-Albert for follow graphs, power law for engagement

### Metis Review
**Identified Gaps** (addressed):
- Tech stack not specified → Default: Next.js 16 (App Router, Turbopack) + Supabase (JS v2) + Tailwind CSS v4 (CSS-first config) + TypeScript (strong consensus from research, versions verified March 2026)
- ML vs heuristic scoring → **Two-Tower neural network** (PyTorch training + ONNX inference in TypeScript) for engagement prediction. Heuristic formulas for weighted scoring, author diversity, and OON penalty. User chose to match X's architecture as closely as possible.
- Synthetic network scale → **200 personas, ~50K tweets** (~250 tweets/persona). User wants enough data for meaningful neural network training. **$0 cost** — tweets generated via OpenCode subagents (user on Claude Max 20x).
- "Live updates" scope → Default: Slider changes trigger feed re-rank via SSE (no real-time LLM generation loop)
- Explainability depth → Default: Level 2 (score breakdown bars per tweet — visual, impressive, not overwhelming)
- LLM provider for tweets → **OpenCode subagents** ($0 — user on Claude Max 20x). Tweets pre-generated as JSON files by task() calls during build, not via API at runtime. No LLM API needed for tweet generation.
- Embedding provider → **Gemini embedding-001** ($0.15/1M tokens, free tier available, MTEB 68.32). Only API cost in the project (~$0.38 for 50K tweets).

---

## Work Objectives

### Core Objective
Reimplement X's "For You" feed ranking pipeline as a tunable TypeScript engine, powered by a synthetic social network of LLM-generated personas, served through a full-stack Next.js web app that lets users control and inspect the algorithm in real-time.

### Concrete Deliverables
- `src/lib/ranking/` — TypeScript ranking pipeline: sources, hydrators, filters, scorers, selectors
- `src/lib/seed/` — Synthetic network seed script: persona generation, tweet generation, follow graph, engagement simulation
- `training/` — Python PyTorch Two-Tower model: training script, ONNX export, requirements.txt
- `models/` — Trained ONNX model file (`two_tower.onnx`) + embedding artifacts
- `src/app/` — Next.js 16 App Router pages: feed, profile, algorithm controls
- `src/components/` — React components: tweet card, feed, slider panel, score breakdown, follow graph
- `supabase/migrations/` — Database schema: users, tweets, follows, engagements, algorithm_weights (+ pgvector)
- `src/app/api/` — API routes: feed endpoint, seed endpoint, weight update endpoint

### Definition of Done
- [ ] `bun test` passes all ranking pipeline unit tests (scoring, filtering, diversity, ordering)
- [ ] `bun run seed` populates DB with 200+ personas, 50K+ tweets, realistic follow graph
- [ ] `python training/two_tower.py` trains Two-Tower model and exports `models/two_tower.onnx`
- [ ] Feed endpoint returns scored, ranked tweets with explainability metadata (using ONNX model for engagement prediction)
- [ ] Moving sliders produces visibly different feed orderings (verified via API diff test)
- [ ] Author diversity prevents >3 tweets from same author in top 20
- [ ] Score breakdown panel shows per-signal contribution for each tweet
- [ ] App runs locally via `bun dev` with no errors

### Must Have
- Ranking pipeline following X's architecture: Retrieve → Hydrate → Filter → Score → Select
- 6 engagement signals: like, reply, repost, click, follow_author, not_interested
- Weighted scoring formula: `Σ(weight_i × P(action_i))` with configurable weights
- Text embeddings for out-of-network retrieval (Gemini `embedding-001`, 1536-dim via Matryoshka, cosine similarity via pgvector)
- 4 sequential scorers: Engagement Scorer → Weighted Scorer → Author Diversity Scorer → OON Scorer
- 10 pre-scoring filters matching X's filter set
- User-facing algorithm control sliders (minimum 4: recency, popularity, network proximity, topic)
- Score breakdown panel per tweet (Level 2 explainability)
- Two-Tower neural network (PyTorch) for engagement prediction, exported to ONNX, inference via onnxruntime-node
- Synthetic network: 200 LLM personas with distinct styles, 50K tweets, realistic follow graph
- SSE-powered live feed re-ranking when sliders change
- Server-side logging with `[RANK]`, `[SEED]`, `[FEED]` tag prefixes

### Must NOT Have (Guardrails)
- End-to-end neural ranking or transformer models — Two-Tower engagement prediction (PyTorch → ONNX → onnxruntime-node) is explicitly allowed; all other scoring uses weighted heuristic formulas
- Real-time LLM generation loop (personas generating tweets while user watches)
- Authentication or multi-user support — single-user demo app
- Direct messages, notifications, or search
- Image/video upload or media handling
- Tweet composition (user observes, doesn't post)
- Mobile responsive design (desktop-first for demo)
- Deployment to production (local dev only)
- More than 6 engagement signals (keep it focused)
- Over-abstracted "framework" code — keep it readable for a learning project

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES (Tests-after) — set up vitest, write tests for ranking pipeline
- **Framework**: vitest (fast, TypeScript-native, works with Next.js)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun test / bun run) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — start immediately, MAX PARALLEL):
├── Task 1: Project scaffolding + tooling [quick]
├── Task 2: Database schema + Supabase setup [quick]
├── Task 3: Type definitions + shared interfaces [quick]
├── Task 4: Vitest test infrastructure [quick]
└── Task 5: LLM persona definitions (JSON config, no API calls yet) [quick]

Wave 2 (Core Engine — after Wave 1, MAX PARALLEL):
├── Task 6: Candidate sources (in-network + out-of-network retrieval) [deep]
├── Task 7: Candidate hydrators (enrich tweets with metadata) [unspecified-high]
├── Task 8: Pre-scoring filters (all 10 filters) [unspecified-high]
├── Task 10: Weighted scorer + author diversity + OON scorer [deep]
├── Task 11: Selector (top-K with diversity) [quick]
└── Task 12: Pipeline orchestrator (wire stages together) [deep]

Wave 3 (Synthetic Network — after Wave 1, PARALLEL with Wave 2):
├── Task 13: Follow graph generator (Barabási-Albert + homophily) [deep]
├── Task 14: Tweet generation via LLM (TWICE pattern) [deep]
├── Task 15: Engagement simulation (power law distributions) [unspecified-high]
└── Task 16: Master seed script (orchestrate 13-15, populate DB) [unspecified-high]

Wave 3.5 (ML Training — after Wave 3, needs seed data):
└── Task 9: Two-Tower engagement prediction (PyTorch → ONNX → TS inference) [deep]

Wave 4 (UI + Controls — after Waves 2 & 3):
├── Task 17: Feed API endpoint (wire pipeline to HTTP) [unspecified-high]
├── Task 18: Algorithm weights API + SSE stream [unspecified-high]
├── Task 19: Tweet card component [visual-engineering]
├── Task 20: Feed page with infinite scroll [visual-engineering]
├── Task 21: Algorithm control panel (sliders) [visual-engineering]
├── Task 22: Score breakdown / explainability panel [visual-engineering]
├── Task 23: Profile page [visual-engineering]
└── Task 24: Follow graph page [visual-engineering]

Wave FINAL (Verification — after ALL tasks):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: Task 1 → Task 2 → Task 6 → Task 12 → Task 16 → Task 17 → Task 20 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2-16 | 1 |
| 2 | 1 | 6, 7, 8, 13, 16 | 1 |
| 3 | 1 | 6-12, 17, 18 | 1 |
| 4 | 1 | unit tests in 9, 10, 11, 12 | 1 |
| 5 | — | 14, 16 | 1 |
| 6 | 2, 3 | 12 | 2 |
| 7 | 2, 3 | 12 | 2 |
| 8 | 3 | 12 | 2 |
| 9 | 3, 4, 15, 16 | — | 3.5 |
| 10 | 3, 4 | 12 | 2 |
| 11 | 3 | 12 | 2 |
| 12 | 6, 7, 8, 10, 11 | 17 | 2 |
| 13 | 2 | 16 | 3 |
| 14 | 2, 5 | 16 | 3 |
| 15 | 2 | 16 | 3 |
| 16 | 13, 14, 15 | 17, 20 | 3 |
| 17 | 12, 16 | 20 | 4 |
| 18 | 2, 3 | 21 | 4 |
| 19 | 3 | 20 | 4 |
| 20 | 17, 19 | F1-F4 | 4 |
| 21 | 18 | F1-F4 | 4 |
| 22 | 3, 17 | F1-F4 | 4 |
| 23 | 2, 19 | F1-F4 | 4 |
| 24 | 2, 13 | F1-F4 | 4 |
| F1-F4 | ALL | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **5 tasks** — T1-T5 → `quick`
- **Wave 2**: **6 tasks** — T6 → `deep`, T7-T8 → `unspecified-high`, T10 → `deep`, T11 → `quick`, T12 → `deep`
- **Wave 3**: **4 tasks** — T13-T14 → `deep`, T15-T16 → `unspecified-high`
- **Wave 3.5**: **1 task** — T9 → `deep`
- **Wave 4**: **8 tasks** — T17-T18 → `unspecified-high`, T19-T24 → `visual-engineering`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

### Wave 1: Foundation (Start Immediately — All Parallel)

- [ ] 1. Project Scaffolding + Tooling

  **What to do**:
  - Initialize Next.js 16 project with App Router, TypeScript, Tailwind CSS v4, and `bun` as package manager
    - `bunx create-next-app@latest` (selects Next.js 16, React 19.2, Tailwind v4 by default)
  - Install core dependencies: `@supabase/supabase-js@2`, `@supabase/ssr`, `@google/genai` (for Gemini embedding-001 embeddings), `onnxruntime-node` (for Two-Tower model inference)
  - Install dev dependencies: `vitest@4`, `@testing-library/react`, `playwright`, `@types/node`
  - Configure `tsconfig.json` with strict mode, path aliases (`@/` → `src/`)
  - Configure `next.config.ts` (App Router, Turbopack is default in Next.js 16)
  - **Tailwind CSS v4 setup** (CRITICAL — different from v3):
    - CSS file uses `@import "tailwindcss"` (NOT `@tailwind base/components/utilities`)
    - Custom theme via `@theme { }` block in CSS (NOT `tailwind.config.js`)
    - PostCSS uses `@tailwindcss/postcss` (NOT `tailwindcss` plugin)
    - No autoprefixer needed (built into v4)
    - No `tailwind.config.js` file — all config in CSS
  - Add `.env.local.example` with required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY` (for Gemini embedding-001 embeddings)
  - Create `training/` directory with `requirements.txt` (torch, onnx, onnxruntime, numpy, psycopg2-binary) and empty `__init__.py`
  - Create `models/` directory with `.gitkeep` (ONNX model files go here after training)
  - Add `.gitignore` for node_modules, .next, .env.local, .sisyphus/evidence/
  - Create directory structure: `src/lib/ranking/`, `src/lib/seed/`, `src/lib/types/`, `src/components/`, `src/app/api/`, `training/`, `models/`
  - Add `package.json` scripts: `dev`, `build`, `test`, `seed`, `lint`
  - **Next.js 16 caching note**: `fetch()` is NOT cached by default (changed from 14). Use `cache: 'force-cache'` or `next: { revalidate: N }` for explicit caching. This is the correct behavior for our feed endpoint (always fresh).
  - **React 19.2 note**: Use `useActionState` (NOT `useFormState`). `use()` hook is stable for reading promises and context.

  **Must NOT do**:
  - Do NOT install ML/AI libraries (tensorflow, pytorch, etc.)
  - Do NOT set up Docker or deployment configs
  - Do NOT create any actual component or page code yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project scaffolding with well-known tools, no complex logic
  - **Skills**: []
    - No specialized skills needed for scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 2, 3, 4, 6-16
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm` repo structure — 4 top-level modules (candidate-pipeline, home-mixer, thunder, phoenix). Our equivalent: `src/lib/ranking/`, `src/lib/seed/`, `src/app/api/`, `src/components/`

  **External References**:
  - Next.js 15 App Router docs: `https://nextjs.org/docs/app`
  - Supabase JS client setup: `https://supabase.com/docs/reference/javascript/introduction`
  - Vitest with Next.js: `https://nextjs.org/docs/app/building-your-application/testing/vitest`

  **Acceptance Criteria**:

  - [ ] `bun install` completes without errors
  - [ ] `bunx tsc --noEmit` passes with zero errors
  - [ ] `bun dev` starts Next.js on localhost:3000
  - [ ] Directory structure exists: `src/lib/ranking/`, `src/lib/seed/`, `src/lib/types/`, `src/components/`
  - [ ] `.env.local.example` lists all required env vars

  **QA Scenarios**:

  ```
  Scenario: Project builds and starts successfully
    Tool: Bash
    Preconditions: Fresh clone, bun installed
    Steps:
      1. Run `bun install` — expect exit code 0
      2. Run `bunx tsc --noEmit` — expect exit code 0, no error output
      3. Run `bun dev &` then `sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
      4. Assert HTTP status is 200
    Expected Result: Project installs, compiles, and serves without errors
    Failure Indicators: Non-zero exit codes, TypeScript errors, connection refused on :3000
    Evidence: .sisyphus/evidence/task-1-project-builds.txt

  Scenario: Required directories exist
    Tool: Bash
    Preconditions: After scaffolding
    Steps:
      1. Run `ls -d src/lib/ranking src/lib/seed src/lib/types src/components src/app/api`
      2. Assert all 5 directories listed without error
    Expected Result: All directories exist
    Failure Indicators: "No such file or directory" for any path
    Evidence: .sisyphus/evidence/task-1-directories-exist.txt
  ```

  **Commit**: YES (group 1)
  - Message: `chore(init): scaffold Next.js 16 + Supabase + vitest project`
  - Files: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.local.example`, `.gitignore`, directory structure
  - Pre-commit: `bunx tsc --noEmit`

- [ ] 2. Database Schema + Supabase Setup

  **What to do**:
  - Initialize Supabase project locally (`bunx supabase init`)
  - Create SQL migration for core tables:
    - `users` — id (uuid), username, display_name, bio, avatar_url, persona_type (enum: founder/journalist/meme/trader/politician/tech/culture), interests (text[]), writing_style (text), follower_count (int), following_count (int), created_at
    - `tweets` — id (uuid), author_id (FK users), content (text), tweet_type (enum: original/reply/quote/repost), parent_tweet_id (nullable FK tweets), quoted_tweet_id (nullable FK tweets), topic (text), embedding (vector(1536) — Gemini embedding-001 via Matryoshka at 1536-dim, nullable until seed runs), like_count (int default 0), reply_count (int default 0), repost_count (int default 0), click_count (int default 0), created_at
    - `follows` — follower_id (FK users), following_id (FK users), created_at, PRIMARY KEY (follower_id, following_id)
    - `engagements` — id (uuid), user_id (FK users), tweet_id (FK tweets), engagement_type (enum: like/reply/repost/click/follow_author/not_interested), created_at
    - `algorithm_weights` — user_id (FK users, unique), recency_weight (float default 0.5), popularity_weight (float default 0.5), network_weight (float default 0.5), topic_relevance_weight (float default 0.5), engagement_type_weights (jsonb), updated_at
  - Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
  - Create indexes: tweets by author_id + created_at, engagements by user_id + tweet_id, follows by follower_id, follows by following_id, tweets embedding by ivfflat for cosine similarity (`CREATE INDEX ON tweets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);`)
  - Create a `viewer` user row (the human user who will interact with the app) — hardcoded UUID for single-user demo
  - Add RLS policies (permissive for demo — allow all reads, restrict writes to service role for seed)

  **Must NOT do**:
  - Do NOT add authentication tables (no auth.users, no sessions)
  - Do NOT add notifications, DMs, or search tables
  - Do NOT add media/image storage tables

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SQL schema creation is straightforward, well-defined structure
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 13, 14, 15, 16
  - **Blocked By**: Task 1 (needs project initialized for supabase init)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/candidate.rs` — PostCandidate struct defines what data a tweet candidate carries (tweet_id, author_id, score, in_network, served_type, screen_names, visibility_reason). Our `tweets` + `users` tables should cover these fields.
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/candidate_features.rs` — CandidateFeatures includes like_count, reply_count, repost_count, follower_count. These map to our column names.
  - `xai-org/x-algorithm:thunder/posts/post_store.rs` — PostStore organizes posts by author_id with time-based retrieval. Our tweets table index on (author_id, created_at) mirrors this.

  **External References**:
  - Supabase local dev: `https://supabase.com/docs/guides/local-development`
  - Supabase migrations: `https://supabase.com/docs/guides/local-development/overview#database-migrations`

  **Acceptance Criteria**:

  - [ ] `bunx supabase db reset` runs migrations successfully
  - [ ] All 5 tables exist: users, tweets, follows, engagements, algorithm_weights
  - [ ] Viewer user row exists with hardcoded UUID
  - [ ] Indexes exist on tweets(author_id, created_at), engagements(user_id), follows(follower_id), follows(following_id)

  **QA Scenarios**:

  ```
  Scenario: Database schema is valid and tables exist
    Tool: Bash
    Preconditions: Supabase CLI installed, project initialized
    Steps:
      1. Run `bunx supabase db reset` — expect exit code 0
      2. Run `bunx supabase db lint` — expect no errors
      3. Query: `psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"` 
      4. Assert output contains: algorithm_weights, engagements, follows, tweets, users
    Expected Result: All 5 tables created, no migration errors
    Failure Indicators: Migration SQL errors, missing tables
    Evidence: .sisyphus/evidence/task-2-schema-valid.txt

  Scenario: Viewer user exists
    Tool: Bash
    Preconditions: After migration
    Steps:
      1. Query: `psql $DATABASE_URL -c "SELECT id, username FROM users WHERE username='viewer';"` 
      2. Assert exactly 1 row returned with username 'viewer'
    Expected Result: Viewer user exists in database
    Failure Indicators: 0 rows returned
    Evidence: .sisyphus/evidence/task-2-viewer-exists.txt
  ```

  **Commit**: YES (group 1)
  - Message: `feat(schema): add database schema for users, tweets, follows, engagements`
  - Files: `supabase/config.toml`, `supabase/migrations/*.sql`
  - Pre-commit: `bunx supabase db reset`

- [ ] 3. Type Definitions + Shared Interfaces

  **What to do**:
  - Create `src/lib/types/database.ts` — TypeScript types matching the DB schema (User, Tweet, Follow, Engagement, AlgorithmWeights)
  - Create `src/lib/types/pipeline.ts` — Pipeline stage interfaces mirroring X's candidate-pipeline traits:
    - `CandidateSource<Q, C>` — `retrieve(query: Q): Promise<C[]>`
    - `Hydrator<Q, C>` — `hydrate(query: Q, candidates: C[]): Promise<C[]>`
    - `Filter<Q, C>` — `filter(query: Q, candidates: C[]): C[]`
    - `Scorer<Q, C>` — `score(query: Q, candidates: C[]): C[]`
    - `Selector<Q, C>` — `select(query: Q, candidates: C[]): C[]`
  - Create `src/lib/types/ranking.ts` — Ranking-specific types:
    - `FeedQuery` — viewer_id, seen_ids, served_ids, algorithm_weights, limit
    - `ScoredCandidate` — tweet + author data + score + in_network flag + explanation object
    - `ScoreExplanation` — per-signal breakdown: { recencyScore, popularityScore, networkScore, topicScore, engagementTypeScores, authorDiversityMultiplier, oonMultiplier, totalScore }
    - `EngagementPredictions` — { like, reply, repost, click, follow_author, not_interested } (all 0-1 floats)
  - Create `src/lib/types/index.ts` — barrel export

  **Must NOT do**:
  - Do NOT add types for notifications, DMs, search, or auth
  - Do NOT use `any` or `unknown` — all types must be explicit
  - Do NOT create runtime validation (Zod schemas) yet — just TypeScript types

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definitions, no logic, well-defined from schema + X's architecture
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 6-12, 17, 18, 19, 22
  - **Blocked By**: Task 1 (needs tsconfig for TypeScript)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:candidate-pipeline/source.rs` — `Source` trait: `async fn get(&self, query: &Q) -> Result<Vec<C>>`. Our `CandidateSource` interface mirrors this.
  - `xai-org/x-algorithm:candidate-pipeline/hydrator.rs` — `Hydrator` trait: `async fn hydrate(&self, query: &Q, candidates: &mut Vec<C>) -> Result<()>`. Our `Hydrator` interface mirrors this.
  - `xai-org/x-algorithm:candidate-pipeline/filter.rs` — `Filter` trait: `fn filter(&self, query: &Q, candidates: &[C]) -> Vec<C>`. Our `Filter` interface mirrors this.
  - `xai-org/x-algorithm:candidate-pipeline/scorer.rs` — `Scorer` trait: `async fn score(&self, query: &Q, candidates: &mut Vec<C>) -> Result<()>`. Our `Scorer` interface mirrors this.
  - `xai-org/x-algorithm:candidate-pipeline/selector.rs` — `Selector` trait: `fn select(&self, query: &Q, candidates: &[C]) -> Vec<C>`. Our `Selector` interface mirrors this.
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/candidate.rs` — PostCandidate struct fields map to our ScoredCandidate type.
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/query.rs` — ScoredPostsQuery struct fields map to our FeedQuery type.

  **Acceptance Criteria**:

  - [ ] `bunx tsc --noEmit` passes with zero errors
  - [ ] All pipeline interfaces exported from `src/lib/types/index.ts`
  - [ ] `FeedQuery`, `ScoredCandidate`, `ScoreExplanation`, `EngagementPredictions` types exist
  - [ ] No `any` or `unknown` in type definitions

  **QA Scenarios**:

  ```
  Scenario: Types compile without errors
    Tool: Bash
    Preconditions: Task 1 complete (tsconfig exists)
    Steps:
      1. Run `bunx tsc --noEmit` — expect exit code 0
      2. Run `grep -r "any" src/lib/types/ --include="*.ts"` — expect 0 matches (no `any` usage)
    Expected Result: All types compile, no `any` usage
    Failure Indicators: TypeScript errors, grep finds `any`
    Evidence: .sisyphus/evidence/task-3-types-compile.txt

  Scenario: Pipeline interfaces match X's architecture
    Tool: Bash
    Preconditions: Types written
    Steps:
      1. Run `grep -c "interface CandidateSource" src/lib/types/pipeline.ts` — expect 1
      2. Run `grep -c "interface Hydrator" src/lib/types/pipeline.ts` — expect 1
      3. Run `grep -c "interface Filter" src/lib/types/pipeline.ts` — expect 1
      4. Run `grep -c "interface Scorer" src/lib/types/pipeline.ts` — expect 1
      5. Run `grep -c "interface Selector" src/lib/types/pipeline.ts` — expect 1
    Expected Result: All 5 pipeline interfaces defined
    Failure Indicators: Any count is 0
    Evidence: .sisyphus/evidence/task-3-pipeline-interfaces.txt
  ```

  **Commit**: YES (group 1)
  - Message: `feat(types): add database types and pipeline interfaces mirroring X's architecture`
  - Files: `src/lib/types/*.ts`
  - Pre-commit: `bunx tsc --noEmit`

- [ ] 4. Vitest Test Infrastructure

  **What to do**:
  - Create `vitest.config.ts` with TypeScript support, path aliases matching tsconfig
  - Create `src/lib/ranking/__tests__/` directory for ranking pipeline tests
  - Create a smoke test `src/lib/ranking/__tests__/smoke.test.ts` that imports types and asserts they exist
  - Add `test` script to package.json: `vitest run`
  - Add `test:watch` script: `vitest`
  - Verify `bun test` runs and passes the smoke test

  **Must NOT do**:
  - Do NOT write actual ranking logic tests yet (those come with Tasks 9-12)
  - Do NOT set up Playwright yet (that's for UI tasks in Wave 4)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard vitest setup, minimal config
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Unit tests in Tasks 9, 10, 11, 12
  - **Blocked By**: Task 1 (needs package.json)

  **References**:

  **External References**:
  - Vitest config: `https://vitest.dev/config/`
  - Vitest with path aliases: `https://vitest.dev/guide/#configuring-vitest`

  **Acceptance Criteria**:

  - [ ] `bun test` runs and passes (1 smoke test)
  - [ ] `vitest.config.ts` exists with path aliases
  - [ ] Test directory exists at `src/lib/ranking/__tests__/`

  **QA Scenarios**:

  ```
  Scenario: Test infrastructure works
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run `bun test` — expect exit code 0
      2. Assert output contains "1 passed" or "Tests  1 passed"
    Expected Result: Smoke test passes
    Failure Indicators: Test runner not found, import errors, test failure
    Evidence: .sisyphus/evidence/task-4-tests-pass.txt
  ```

  **Commit**: YES (group 1)
  - Message: `test(infra): set up vitest with TypeScript and path aliases`
  - Files: `vitest.config.ts`, `src/lib/ranking/__tests__/smoke.test.ts`
  - Pre-commit: `bun test`

- [ ] 5. LLM Persona Definitions (JSON Config)

  **What to do**:
  - Create `src/lib/seed/personas.ts` — array of 200 persona definitions, each with:
    - `name`, `username`, `bio`, `persona_type` (founder/journalist/meme/trader/politician/tech/culture)
    - `interests` (string array, 3-5 topics per persona)
    - `writing_style` (description: "formal and analytical", "shitpost energy with emojis", etc.)
    - `tweet_frequency` (tweets_per_day: 1-20, following power law — most post 1-3/day, few post 10+)
    - `engagement_rate` (0.0-1.0 — how likely they are to engage with others' content)
    - `follower_tier` (micro/mid/macro/mega — determines follower count range)
    - `example_tweets` (3-5 example tweets showing their voice — used as few-shot examples for LLM generation)
  - Include diverse persona distribution:
    - 40 founders/startup (tech CEOs, indie hackers, VCs)
    - 30 journalists (tech reporters, political correspondents, culture writers)
    - 25 meme accounts (shitposters, parody accounts)
    - 30 traders (stock traders, crypto, macro analysts)
    - 25 politicians (senators, commentators, activists)
    - 25 tech accounts (engineers, open source maintainers, AI researchers)
    - 25 culture accounts (artists, musicians, film critics, sports)
  - Create `src/lib/seed/topics.ts` — topic taxonomy with 20-30 topics (tech, AI, startups, markets, politics, culture, sports, crypto, etc.) used for tweet tagging and topic-based retrieval

  **Must NOT do**:
  - Do NOT call any LLM API in this task — just define the config data
  - Do NOT generate actual tweets — that's Task 14
  - Do NOT hardcode 200 personas manually — use a generation pattern (define 20-30 archetypes, then programmatically vary names/bios/interests to reach 200)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Data definition task, no complex logic — but needs creative persona variety
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 14, 16
  - **Blocked By**: None (can start immediately — no code dependencies)

  **References**:

  **External References**:
  - TWICE framework for persona-driven tweet generation: separate content planning from style adaptation
  - YSocial research: LLM social network simulation with distinct persona archetypes

  **Acceptance Criteria**:

  - [ ] `src/lib/seed/personas.ts` exports array of 200 persona definitions
  - [ ] Each persona has: name, username, bio, persona_type, interests, writing_style, example_tweets
  - [ ] All 7 persona_type categories represented with target distribution (±5)
  - [ ] `src/lib/seed/topics.ts` exports 20+ topic definitions
  - [ ] `bunx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: Persona definitions are complete and diverse
    Tool: Bash
    Preconditions: File written
    Steps:
      1. Run `bun -e "import { personas } from './src/lib/seed/personas'; console.log(personas.length)"` — expect >= 200
      2. Run `bun -e "import { personas } from './src/lib/seed/personas'; const types = [...new Set(personas.map(p => p.persona_type))]; console.log(types.sort().join(','))"` — expect "culture,founder,journalist,meme,politician,tech,trader"
      3. Run `bun -e "import { personas } from './src/lib/seed/personas'; console.log(personas.every(p => p.example_tweets?.length >= 3))"` — expect "true"
    Expected Result: 200+ personas across all 7 types, each with 3+ example tweets
    Failure Indicators: Count < 200, missing persona types, missing example tweets
    Evidence: .sisyphus/evidence/task-5-personas-complete.txt
  ```

  **Commit**: YES (group 1)
  - Message: `feat(seed): add 200 LLM persona definitions with diverse archetypes`
  - Files: `src/lib/seed/personas.ts`, `src/lib/seed/topics.ts`
  - Pre-commit: `bunx tsc --noEmit`

### Wave 2: Core Ranking Engine (After Wave 1 — MAX PARALLEL)

- [ ] 6. Candidate Sources (In-Network + Out-of-Network Retrieval)

  **What to do**:
  - Create `src/lib/ranking/sources/in-network-source.ts` — InNetworkSource class implementing CandidateSource:
    - Query Supabase for recent tweets from accounts the viewer follows
    - Join follows → tweets → users to get author metadata
    - Limit to tweets from last 48 hours (configurable)
    - Sort by created_at descending
    - Mark each candidate as `in_network: true`
    - Log: `[RANK] In-network source: retrieved ${count} candidates from ${followCount} followed accounts`
  - Create `src/lib/ranking/sources/out-of-network-source.ts` — OutOfNetworkSource class implementing CandidateSource:
    - Query Supabase for tweets from accounts the viewer does NOT follow, using pgvector cosine similarity
    - Compute viewer query vector: average the `embedding` vectors of the viewer's recently-engaged tweets (last 50 engagements). If no engagements exist, fall back to embedding the viewer's `interests` array as a comma-separated string via Gemini embedding-001
    - Use pgvector `<=>` operator (cosine distance) to find nearest tweets: `ORDER BY embedding <=> $queryVector LIMIT $limit`
    - Filter: exclude followed authors, limit to tweets from last 72 hours
    - Mark each candidate as `in_network: false`
    - Log: `[RANK] Out-of-network source: retrieved ${count} candidates via embedding similarity (cosine)`
  - Create `src/lib/ranking/sources/index.ts` — barrel export

  **Must NOT do**:
  - Do NOT fetch ALL tweets — always use time windows and limits
  - Do NOT skip pgvector cosine similarity for out-of-network retrieval — use Gemini embedding-001 embeddings stored in the `embedding` column with ivfflat index

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding X's source architecture and translating Rust patterns to TypeScript + Supabase queries
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 10, 11)
  - **Blocks**: Task 12 (pipeline orchestrator)
  - **Blocked By**: Tasks 2 (DB schema), 3 (types)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:home-mixer/sources/thunder_source.rs` — ThunderSource fetches in-network posts from followed accounts. Our InNetworkSource mirrors this but queries Supabase instead of Thunder's in-memory store.
  - `xai-org/x-algorithm:home-mixer/sources/phoenix_source.rs` — PhoenixSource fetches out-of-network posts via ML retrieval. Our OutOfNetworkSource simplifies this to interest-based SQL queries.
  - `xai-org/x-algorithm:candidate-pipeline/source.rs` — Source trait interface. Our CandidateSource interface from Task 3 mirrors this.

  **API/Type References**:
  - `src/lib/types/pipeline.ts:CandidateSource` — interface to implement
  - `src/lib/types/ranking.ts:FeedQuery` — query input type
  - `src/lib/types/ranking.ts:ScoredCandidate` — output candidate type

  **Acceptance Criteria**:

  - [ ] InNetworkSource retrieves tweets only from followed accounts
  - [ ] OutOfNetworkSource retrieves tweets only from non-followed accounts
  - [ ] Both sources respect time window limits (48h in-network, 72h out-of-network)
  - [ ] Both sources set `in_network` flag correctly on candidates
  - [ ] `bunx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: In-network source returns only followed accounts' tweets
    Tool: Bash (bun test)
    Preconditions: DB seeded with test data (viewer follows user-A, not user-B)
    Steps:
      1. Call InNetworkSource.retrieve({ viewerId: 'viewer-1', ... })
      2. Assert all returned candidates have author_id matching a followed account
      3. Assert all candidates have in_network === true
      4. Assert no candidate has author_id of an unfollowed account
    Expected Result: Only followed accounts' tweets returned, all marked in_network
    Failure Indicators: Tweets from unfollowed accounts appear, in_network flag wrong
    Evidence: .sisyphus/evidence/task-6-in-network-source.txt

  Scenario: Out-of-network source excludes followed accounts
    Tool: Bash (bun test)
    Preconditions: DB seeded with test data
    Steps:
      1. Call OutOfNetworkSource.retrieve({ viewerId: 'viewer-1', ... })
      2. Assert NO returned candidate has author_id matching a followed account
      3. Assert all candidates have in_network === false
    Expected Result: Only non-followed accounts' tweets returned
    Failure Indicators: Followed accounts' tweets appear
    Evidence: .sisyphus/evidence/task-6-oon-source.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(pipeline): add in-network and out-of-network candidate sources`
  - Files: `src/lib/ranking/sources/*.ts`
  - Pre-commit: `bun test`

- [ ] 7. Candidate Hydrators (Enrich Tweets with Metadata)

  **What to do**:
  - Create `src/lib/ranking/hydrators/core-data-hydrator.ts` — CoreDataHydrator implementing Hydrator:
    - Fetch full tweet content, media flags, tweet_type for candidates that only have IDs
    - Fetch author metadata: username, display_name, follower_count, persona_type
    - Compute derived fields: tweet_age_hours, has_media, is_reply, is_quote, is_repost
    - Log: `[RANK] Hydrated ${count} candidates with core data`
  - Create `src/lib/ranking/hydrators/engagement-hydrator.ts` — EngagementHydrator implementing Hydrator:
    - Fetch engagement counts for each candidate: like_count, reply_count, repost_count, click_count
    - Fetch viewer's personal engagement history with each candidate's author (has viewer liked/followed/muted this author before?)
    - Compute: `viewer_author_affinity` — ratio of viewer's past engagements with this author vs. total engagements
    - Log: `[RANK] Hydrated ${count} candidates with engagement data`
  - Create `src/lib/ranking/hydrators/index.ts` — barrel export

  **Must NOT do**:
  - Do NOT fetch video duration or subscription status (not in our schema)
  - Do NOT implement batch hydration with external APIs — all data is in Supabase

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires Supabase query optimization (batch fetching, joins) and understanding hydrator pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 10, 11)
  - **Blocks**: Task 12 (pipeline orchestrator)
  - **Blocked By**: Tasks 2 (DB schema), 3 (types)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:home-mixer/candidate_hydrators/core_data_candidate_hydrator.rs` — Fetches core tweet metadata. Our CoreDataHydrator mirrors this.
  - `xai-org/x-algorithm:home-mixer/candidate_hydrators/gizmoduck_hydrator.rs` — Fetches author/user metadata. Our CoreDataHydrator combines this with tweet data.
  - `xai-org/x-algorithm:candidate-pipeline/hydrator.rs` — Hydrator trait: mutates candidates in-place with enriched data.

  **Acceptance Criteria**:

  - [ ] CoreDataHydrator adds author metadata to all candidates
  - [ ] EngagementHydrator adds engagement counts and viewer_author_affinity
  - [ ] Hydrators handle missing data gracefully (no crashes on null fields)
  - [ ] `bunx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: Hydrators enrich candidates with complete metadata
    Tool: Bash (bun test)
    Preconditions: DB seeded, raw candidates from sources
    Steps:
      1. Create raw candidates with only tweet_id and author_id
      2. Run CoreDataHydrator.hydrate(query, candidates)
      3. Assert each candidate now has: content, author.username, author.follower_count, tweet_age_hours
      4. Run EngagementHydrator.hydrate(query, candidates)
      5. Assert each candidate now has: like_count, reply_count, viewer_author_affinity
    Expected Result: All metadata fields populated
    Failure Indicators: Undefined fields after hydration, SQL errors
    Evidence: .sisyphus/evidence/task-7-hydrators.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(pipeline): add core data and engagement hydrators`
  - Files: `src/lib/ranking/hydrators/*.ts`
  - Pre-commit: `bun test`

- [ ] 8. Pre-Scoring Filters (All 10 Filters)

  **What to do**:
  - Create `src/lib/ranking/filters/` directory with one file per filter, each implementing the Filter interface:
    1. `drop-duplicates-filter.ts` — Remove candidates with duplicate tweet IDs
    2. `core-data-hydration-filter.ts` — Remove candidates that failed hydration (missing content or author)
    3. `age-filter.ts` — Remove tweets older than configurable threshold (default 48h)
    4. `self-tweet-filter.ts` — Remove viewer's own tweets
    5. `repost-dedup-filter.ts` — If multiple reposts of the same original tweet, keep only the one from the closest connection
    6. `previously-seen-filter.ts` — Remove tweets whose IDs are in the query's `seen_ids` set
    7. `previously-served-filter.ts` — Remove tweets whose IDs are in the query's `served_ids` set
    8. `muted-keyword-filter.ts` — Remove tweets containing any of the viewer's muted keywords (empty list by default for demo)
    9. `blocked-author-filter.ts` — Remove tweets from authors the viewer has blocked/muted (check engagements table for not_interested actions)
    10. `conversation-dedup-filter.ts` — If multiple tweets from the same conversation thread, keep only the most relevant one
  - Create `src/lib/ranking/filters/index.ts` — barrel export + `createFilterChain()` function that returns filters in correct order (cheap filters first)
  - Each filter should log: `[RANK] ${FilterName}: removed ${removedCount} candidates (${remaining} remaining)`

  **Must NOT do**:
  - Do NOT implement content-based filtering (NSFW detection, spam detection) — no ML classifiers
  - Do NOT implement subscription/paywall filters — not in our schema

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 10 filters with specific logic each, needs careful ordering and edge case handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 10, 11)
  - **Blocks**: Task 12 (pipeline orchestrator)
  - **Blocked By**: Task 3 (types)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:home-mixer/filters/drop_duplicates_filter.rs` — Dedup by tweet_id
  - `xai-org/x-algorithm:home-mixer/filters/age_filter.rs` — Time-based filtering
  - `xai-org/x-algorithm:home-mixer/filters/self_tweet_filter.rs` — Remove viewer's own tweets
  - `xai-org/x-algorithm:home-mixer/filters/retweet_deduplication_filter.rs` — Repost dedup logic
  - `xai-org/x-algorithm:home-mixer/filters/previously_seen_posts_filter.rs` — Seen post tracking
  - `xai-org/x-algorithm:home-mixer/filters/previously_served_posts_filter.rs` — Served post tracking
  - `xai-org/x-algorithm:home-mixer/filters/muted_keyword_filter.rs` — Keyword muting
  - `xai-org/x-algorithm:home-mixer/filters/author_socialgraph_filter.rs` — Block/mute author filtering
  - `xai-org/x-algorithm:home-mixer/filters/dedup_conversation_filter.rs` — Conversation thread dedup
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs:100-115` — Filter ordering (cheap pre-scoring first, expensive post-selection last)

  **Acceptance Criteria**:

  - [ ] All 10 filters implemented and exported
  - [ ] `createFilterChain()` returns filters in correct order (duplicates first, conversation dedup last)
  - [ ] Each filter logs removal count with `[RANK]` prefix
  - [ ] Filters are pure functions (no side effects, no DB writes)
  - [ ] `bunx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: Filter chain removes correct candidates
    Tool: Bash (bun test)
    Preconditions: Test candidates including duplicates, old tweets, self-tweets, seen tweets
    Steps:
      1. Create 20 test candidates including: 2 duplicates, 1 tweet >48h old, 1 self-tweet, 2 previously seen
      2. Run createFilterChain() and apply all filters sequentially
      3. Assert duplicates removed (18 remaining after dedup)
      4. Assert old tweet removed
      5. Assert self-tweet removed
      6. Assert seen tweets removed
      7. Assert final count is 14
    Expected Result: 6 candidates removed by various filters, 14 remaining
    Failure Indicators: Wrong candidates removed, filter order incorrect, count mismatch
    Evidence: .sisyphus/evidence/task-8-filter-chain.txt

  Scenario: Filters handle empty input gracefully
    Tool: Bash (bun test)
    Preconditions: None
    Steps:
      1. Run each filter with empty candidate array
      2. Assert each returns empty array without error
    Expected Result: No crashes on empty input
    Failure Indicators: TypeError, undefined errors
    Evidence: .sisyphus/evidence/task-8-empty-input.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(pipeline): add 10 pre-scoring filters matching X's filter architecture`
  - Files: `src/lib/ranking/filters/*.ts`
  - Pre-commit: `bun test`

- [ ] 9. Two-Tower Neural Network (PyTorch Training + ONNX Export + TypeScript Inference)

  **What to do**:

  **Part A: PyTorch Training Script** (`training/two_tower.py`):
  - Define Two-Tower architecture in PyTorch:
    - **User Tower**: user_id embedding (dim=64) + dense layers (64→32) → user_vector (32-dim)
    - **Tweet Tower**: tweet features (author_follower_tier, topic_id, tweet_type, age_hours, like_count, reply_count, repost_count, is_reply, is_quote) → embedding + dense layers (64→32) → tweet_vector (32-dim)
    - **Interaction**: dot product of user_vector × tweet_vector → 6 sigmoid outputs (P(like), P(reply), P(repost), P(click), P(follow_author), P(not_interested))
  - Training loop:
    - Load engagement data from Supabase (via psycopg2 direct connection to local Supabase postgres)
    - Train/test split: 80/20
    - Loss: Binary cross-entropy per engagement type (multi-task learning)
    - Optimizer: Adam, lr=0.001
    - Epochs: 50 (with early stopping on validation loss)
    - Batch size: 256
    - Log: training loss, validation loss, per-task AUC after each epoch
  - Save trained model: `models/two_tower.pt` (PyTorch checkpoint)
  - Print training summary: final loss, per-task AUC, training time

  **Part B: ONNX Export** (`training/export_onnx.py`):
  - Load trained PyTorch model
  - Export to ONNX format: `models/two_tower.onnx`
  - Verify ONNX model produces same outputs as PyTorch model (within tolerance)
  - Export feature metadata: `models/feature_config.json` (feature names, embedding dimensions, normalization params)

  **Part C: Upgrade Engagement Predictor to ONNX** (`src/lib/ranking/scorers/engagement-predictor.ts`):
  - Modify the existing heuristic engagement predictor (created in Task 10) to support ONNX inference:
    - Load ONNX model via `onnxruntime-node` at startup (singleton, cached)
    - If ONNX model file exists (`models/two_tower.onnx`): extract user/tweet features → tensors → run ONNX session → return 6 probabilities
    - If ONNX model file missing: fall back to existing heuristic formulas (preserves Wave 2 behavior)
    - Add batch inference: `predictEngagementBatch(viewer, candidates[])` for efficiency
    - Log: `[RANK] Engagement predictions (ONNX): tweet ${id}: like=${P_like}, reply=${P_reply}, ... (${ms}ms)`
  - Update unit tests in `src/lib/ranking/__tests__/engagement-predictor.test.ts`:
    - Test ONNX predictions are in [0, 1] range
    - Test batch inference matches individual inference
    - Test heuristic fallback still works when model is missing
    - Test determinism: same input → same output

  **Must NOT do**:
  - Do NOT train in JavaScript/TensorFlow.js — use PyTorch (research confirmed it's 10-50x faster)
  - Do NOT make predictions depend on other candidates (candidate isolation!)
  - Do NOT use GPU-specific PyTorch features — CPU training only (M5 Pro)
  - Do NOT over-engineer the model — keep it simple, 2-3 layers per tower max

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires PyTorch model definition, training loop, ONNX export, AND TypeScript inference wrapper. Cross-language task with ML concepts.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3.5 (after seed data exists, before UI)
  - **Blocks**: — (Task 10 uses heuristic fallback; ONNX model is a drop-in upgrade)
  - **Blocked By**: Tasks 3 (types), 4 (test infra), 15 (engagement data to train on), 16 (seed must run first)

  **References**:

  **Pattern References**:
  - `xai-org/x-algorithm:phoenix/recsys_model.py` — Phoenix Two-Tower model predicts 19 engagement types. We simplify to 6 but follow the same architecture pattern.
  - `xai-org/x-algorithm:home-mixer/scorers/phoenix_scorer.rs` — PhoenixScorer calls the model and extracts predictions. Our TypeScript wrapper mirrors this.

  **External References**:
  - PyTorch Two-Tower tutorial: `https://pytorch.org/tutorials/intermediate/two_tower_tutorial.html`
  - ONNX export from PyTorch: `https://pytorch.org/docs/stable/onnx.html`
  - onnxruntime-node API: `https://onnxruntime.ai/docs/api/js/`
  - Redis Two-Tower reference implementation (Feb 2026): `https://redis.io/learn/building-a-two-tower-recommendation-system-with-redis-vl`

  **Acceptance Criteria**:
  - [ ] `python training/two_tower.py` trains model and saves `models/two_tower.pt` (< 15 min on M5 Pro)
  - [ ] `python training/export_onnx.py` exports `models/two_tower.onnx` with matching outputs
  - [ ] `models/feature_config.json` documents all features and normalization params
  - [ ] `engagement-predictor.ts` upgraded to load ONNX model, falls back to heuristics when model missing
  - [ ] Batch inference works (predict for 50+ candidates in one call)
  - [ ] Fallback heuristics work when ONNX model is missing
  - [ ] Unit tests pass (`bun test`)
  - [ ] `bunx tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: PyTorch model trains successfully
    Tool: Bash
    Preconditions: DB seeded with 50K tweets + engagements
    Steps:
      1. Run `python training/two_tower.py` — expect exit code 0
      2. Assert `models/two_tower.pt` exists and is > 100KB
      3. Assert training log shows decreasing loss over epochs
      4. Assert per-task AUC > 0.55 (better than random for at least some tasks)
    Expected Result: Model trains, loss decreases, model file saved
    Failure Indicators: CUDA errors (should be CPU-only), loss NaN, AUC < 0.5
    Evidence: .sisyphus/evidence/task-9-training.txt

  Scenario: ONNX export matches PyTorch outputs
    Tool: Bash
    Preconditions: PyTorch model trained
    Steps:
      1. Run `python training/export_onnx.py` — expect exit code 0
      2. Assert `models/two_tower.onnx` exists
      3. Assert `models/feature_config.json` exists and contains feature names
      4. Script should print "Max output difference: X" where X < 0.001
    Expected Result: ONNX model produces identical outputs to PyTorch
    Failure Indicators: Large output differences, export errors
    Evidence: .sisyphus/evidence/task-9-onnx-export.txt

  Scenario: TypeScript inference returns valid predictions
    Tool: Bash (bun test)
    Preconditions: ONNX model exported
    Steps:
      1. Run engagement predictor with test candidate
      2. Assert all 6 predictions in [0, 1]
      3. Run batch prediction with 50 candidates
      4. Assert batch results match individual results
      5. Delete ONNX model, run predictor again — assert fallback heuristics work
    Expected Result: ONNX inference works, fallback works
    Failure Indicators: onnxruntime load error, predictions outside [0,1], batch mismatch
    Evidence: .sisyphus/evidence/task-9-ts-inference.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(ml): add Two-Tower neural network (PyTorch training + ONNX inference)`
  - Files: `training/*.py`, `training/requirements.txt`, `models/.gitkeep`, `src/lib/ranking/scorers/engagement-predictor.ts`, `src/lib/ranking/__tests__/engagement-predictor.test.ts`
  - Pre-commit: `bun test`

- [ ] 10. Weighted Scorer + Author Diversity + OON Scorer

  **What to do**:
  - Create `src/lib/ranking/scorers/engagement-predictor.ts` — EngagementPredictor implementing Scorer:
    - Heuristic fallback that estimates engagement probabilities WITHOUT a trained model
    - For each candidate, compute: P(like) based on author_follower_count and tweet age, P(reply) based on tweet_type (questions get higher), P(repost) based on engagement_count, P(click) = 0.1 baseline, P(follow_author) based on is_in_network (lower for already-followed), P(not_interested) = 0.05 baseline
    - Populates `EngagementPredictions` object on each candidate
    - Interface: `predictEngagement(viewer: User, candidate: ScoredCandidate): EngagementPredictions`
    - This file will later be upgraded by Task 9 to use ONNX inference instead of heuristics
    - Log: `[RANK] Engagement predictions (heuristic): tweet ${id}: like=${P_like}, reply=${P_reply}, ... (${ms}ms)`
  - Create `src/lib/ranking/scorers/weighted-scorer.ts` — WeightedScorer implementing Scorer:
    - Takes engagement predictions (from heuristic fallback predictor initially; upgraded to ONNX model from Task 9 when available) + algorithm_weights from FeedQuery
    - Computes: `totalScore = Σ(user_weight_i × prediction_i)` for positive signals, minus penalties for negative signals
    - Applies user's slider weights: recency_weight, popularity_weight, network_weight, topic_relevance_weight
    - Populates `ScoreExplanation` object on each candidate with per-signal breakdown
    - Log: `[RANK] Weighted scorer: scored ${count} candidates, range [${min}, ${max}]`
  - Create `src/lib/ranking/scorers/author-diversity-scorer.ts` — AuthorDiversityScorer implementing Scorer:
    - After weighted scoring, apply exponential decay penalty for repeated authors
    - Formula: `multiplier = (1 - floor) × decay^position + floor` where position = how many tweets from this author already appeared above
    - Default: decay=0.5, floor=0.1 (3rd tweet from same author gets 0.35x multiplier)
    - Log: `[RANK] Author diversity: penalized ${count} candidates from repeated authors`
  - Create `src/lib/ranking/scorers/oon-scorer.ts` — OutOfNetworkScorer implementing Scorer:
    - Apply multiplicative penalty to out-of-network candidates: `score *= oon_penalty_factor` (default 0.7)
    - This ensures in-network content has a natural advantage unless it scores much lower
    - Log: `[RANK] OON scorer: penalized ${count} out-of-network candidates by ${factor}x`
  - Create `src/lib/ranking/scorers/index.ts` — barrel export + `createScorerChain()` returning scorers in order: EngagementPredictor → WeightedScorer → AuthorDiversityScorer → OutOfNetworkScorer
  - Write unit tests for all 4 scorers (engagement predictor heuristics, weighted scorer, author diversity, OON)

  **Must NOT do**:
  - Do NOT normalize scores to [0, 1] — raw weighted sums are fine for ranking
  - Do NOT make diversity scoring depend on final selection (it runs before selection)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7, 8, 11 in Wave 2)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 3, 4

  **References**:
  - `xai-org/x-algorithm:home-mixer/scorers/weighted_scorer.rs` — Weighted sum of engagement predictions
  - `xai-org/x-algorithm:home-mixer/scorers/author_diversity_scorer.rs` — Exponential decay for repeated authors
  - `xai-org/x-algorithm:home-mixer/scorers/oon_scorer.rs` — Out-of-network penalty factor

  **Acceptance Criteria**:
  - [ ] WeightedScorer produces ScoreExplanation with per-signal breakdown
  - [ ] Changing slider weights changes the ranking order
  - [ ] AuthorDiversityScorer reduces score for 2nd+ tweet from same author
  - [ ] OON scorer penalizes out-of-network candidates
  - [ ] All unit tests pass

  **QA Scenarios**:
  ```
  Scenario: Slider weights change ranking order
    Tool: Bash (bun test)
    Steps:
      1. Create 3 candidates: one recent+unpopular, one old+popular, one mid+mid
      2. Score with recency_weight=1.0, popularity_weight=0.0 → assert recent tweet ranks first
      3. Score with recency_weight=0.0, popularity_weight=1.0 → assert popular tweet ranks first
    Evidence: .sisyphus/evidence/task-10-sliders.txt
  ```

  **Commit**: YES (group 3)

- [ ] 11. Selector (Top-K with Diversity)

  **What to do**:
  - Create `src/lib/ranking/selectors/top-k-selector.ts` — TopKSelector implementing Selector:
    - Sort candidates by totalScore descending
    - Take top K (default 50, configurable via FeedQuery.limit)
    - Final diversity check: ensure no more than 3 tweets from same author in top 20
    - If violated, swap out the 4th+ tweet from same author with next-highest-scoring tweet from a different author
    - Log: `[RANK] Selected top ${K} from ${total} candidates`
  - Create `src/lib/ranking/selectors/index.ts` — barrel export

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6-10, no code dependency until Task 12 wires it)
  - **Blocks**: Task 12
  - **Blocked By**: Task 3 (types)

  **References**:
  - `xai-org/x-algorithm:home-mixer/selectors/top_k_selector.rs` — Top-K selection with diversity enforcement

  **Acceptance Criteria**:
  - [ ] Returns exactly K candidates (or fewer if input < K)
  - [ ] No more than 3 tweets from same author in top 20
  - [ ] Candidates sorted by totalScore descending

  **QA Scenarios**:
  ```
  Scenario: Author diversity enforced in selection
    Tool: Bash (bun test)
    Steps:
      1. Create 20 candidates, 10 from author-A (high scores), 10 from others
      2. Select top 20
      3. Assert author-A has <= 3 tweets in result
    Evidence: .sisyphus/evidence/task-11-diversity.txt
  ```

  **Commit**: YES (group 3)

- [ ] 12. Pipeline Orchestrator (Wire All Stages Together)

  **What to do**:
  - Create `src/lib/ranking/pipeline.ts` — RankingPipeline class:
    - Constructor takes: sources[], hydrators[], filters[], scorers[], selectors[]
    - `async execute(query: FeedQuery): Promise<ScoredCandidate[]>` method:
      1. Retrieve candidates from all sources in parallel, merge results
      2. Run hydrators sequentially (each enriches candidates in-place)
      3. Run pre-scoring filters sequentially (each removes candidates)
      4. Run scorers sequentially (engagement predictor → weighted → diversity → OON)
      5. Run selectors (top-K with diversity)
      6. Return final ranked list with ScoreExplanation attached
    - Log timing for each stage: `[RANK] Pipeline stage ${name}: ${ms}ms (${count} candidates)`
    - Log total: `[RANK] Pipeline complete: ${totalMs}ms, ${inputCount} → ${outputCount} candidates`
  - Create `src/lib/ranking/create-pipeline.ts` — factory function that wires all concrete implementations together:
    - `createDefaultPipeline(supabase: SupabaseClient): RankingPipeline`
    - Instantiates InNetworkSource, OutOfNetworkSource, CoreDataHydrator, EngagementHydrator, all 10 filters, all 4 scorers, TopKSelector
  - Write integration test: mock Supabase, feed test data through full pipeline, assert output is scored and ordered

  **Must NOT do**:
  - Do NOT add caching at the pipeline level yet
  - Do NOT add error recovery/retry — fail fast for now

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6-11)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 6, 7, 8, 10, 11

  **References**:
  - `xai-org/x-algorithm:home-mixer/candidate_pipeline/phoenix_candidate_pipeline.rs` — Full pipeline wiring: sources → hydrators → filters → scorers → selectors
  - `xai-org/x-algorithm:candidate-pipeline/candidate_pipeline.rs` — Generic pipeline executor

  **Acceptance Criteria**:
  - [ ] Pipeline executes all 5 stages in correct order
  - [ ] Output candidates have ScoreExplanation populated
  - [ ] Output is sorted by totalScore descending
  - [ ] Timing logs present for each stage
  - [ ] Integration test passes

  **QA Scenarios**:
  ```
  Scenario: Full pipeline produces ranked output
    Tool: Bash (bun test)
    Steps:
      1. Mock Supabase with 50 test tweets from 10 authors
      2. Run createDefaultPipeline().execute(testQuery)
      3. Assert output length <= query.limit
      4. Assert output sorted by totalScore descending
      5. Assert each candidate has explanation object
    Evidence: .sisyphus/evidence/task-12-pipeline.txt
  ```

  **Commit**: YES (group 3)
  - Message: `feat(pipeline): implement ranking pipeline (sources, hydrators, filters, scorers, selector)`

### Wave 3: Synthetic Network (After Wave 1 — PARALLEL with Wave 2)

- [ ] 13. Follow Graph Generator

  **What to do**:
  - Create `src/lib/seed/follow-graph.ts` — generate realistic follow relationships:
    - Use modified Barabási-Albert preferential attachment: high-follower accounts attract more followers
    - Add homophily: personas with similar interests/types are more likely to follow each other (e.g., traders follow traders)
    - Target distribution: most personas have 10-50 followers, few have 500+, 2-3 "mega" accounts have 1000+
    - The viewer user follows ~50 accounts across diverse types (ensures feed has variety)
    - Generate Follow records with created_at timestamps spread over past 6 months
    - Update follower_count and following_count on user records
    - Log: `[SEED] Follow graph: ${totalFollows} relationships, avg ${avg} followers/user`

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 15)
  - **Blocks**: Task 16
  - **Blocked By**: Task 2 (DB schema)

  **Acceptance Criteria**:
  - [ ] Follow graph has power-law distribution (few high-follower, many low-follower)
  - [ ] Viewer follows ~50 accounts across all persona types
  - [ ] No self-follows
  - [ ] follower_count/following_count match actual follow records

  **QA Scenarios**:
  ```
  Scenario: Follow graph has realistic distribution
    Tool: Bash
    Steps:
      1. Run follow graph generator
      2. Query: SELECT follower_count, count(*) FROM users GROUP BY follower_count ORDER BY follower_count
      3. Assert most users have < 50 followers, few have > 500
      4. Assert viewer follows >= 40 accounts
    Evidence: .sisyphus/evidence/task-13-follow-graph.txt
  ```

  **Commit**: YES (group 4)

- [ ] 14. Tweet Generation via LLM

  **What to do**:
  - Create `src/lib/seed/tweet-generator.ts` — generate tweets using LLM API:
    - For each persona, generate ~250 tweets matching their writing style and interests (~50K total across 200 personas)
    - Use few-shot prompting: include persona's example_tweets as style reference
    - Generate mix of tweet types: ~70% original, ~15% replies, ~10% quotes, ~5% threads
    - Each tweet gets a topic tag from the topic taxonomy (Task 5)
    - Spread created_at timestamps over past 7 days with realistic posting patterns (more tweets during waking hours)
    - **Tweet generation is done via OpenCode subagents (task() calls), NOT via LLM API**
      - User is on Claude Max 20x — subagent calls are free, API calls cost $14+
      - Spawn ~10 `task()` calls in parallel, each generating tweets for ~20 personas
      - Each subagent writes a JSON file: `src/lib/seed/generated/batch-{NN}.json`
      - JSON schema per tweet: `{ persona_username, content, tweet_type, topic, parent_ref?, created_at_offset_hours }`
      - Subagents receive persona definitions (name, bio, interests, writing_style, example_tweets) and generate 250 tweets per persona matching their voice
      - Total: ~50K tweets across 200 personas, $0 cost
    - Log: `[SEED] Loaded ${count} pre-generated tweets from ${fileCount} batch files`
  - Create `src/lib/seed/load-generated-tweets.ts` — reads all `src/lib/seed/generated/batch-*.json` files, validates schema, returns typed array
  - After loading tweets, embed all tweets using **Gemini embedding-001** (1536-dim via Matryoshka):
    - Batch embed via `@google/genai` SDK
    - Store embedding vectors in tweets.embedding column (pgvector)
    - Log: `[SEED] Embedded ${count} tweets via Gemini embedding-001 (${ms}ms)`

  **Must NOT do**:
  - Do NOT call any LLM API for tweet generation — use OpenCode subagents instead ($0 cost)
  - Do NOT generate tweets at runtime (only during seed)
  - Do NOT generate more than 250 tweets per persona (50K total target)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13, 15)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 2 (DB schema), 5 (persona definitions)

  **Acceptance Criteria**:
  - [ ] ~50K tweets generated across 200 personas
  - [ ] Each tweet has content, topic, tweet_type, created_at
  - [ ] Writing styles vary by persona type (founder ≠ meme account)
  - [ ] Reply tweets reference valid parent_tweet_ids
  - [ ] Generation cost: $0 (via OpenCode subagents, not LLM API)

  **QA Scenarios**:
  ```
  Scenario: Generated tweets match persona styles
    Tool: Bash
    Steps:
      1. Generate tweets for 3 test personas (founder, meme, journalist)
      2. Assert founder tweets contain business/startup language
      3. Assert meme tweets are shorter, use emojis/slang
      4. Assert journalist tweets are more formal
    Evidence: .sisyphus/evidence/task-14-tweet-styles.txt
  ```

  **Commit**: YES (group 4)

- [ ] 15. Engagement Simulation

  **What to do**:
  - Create `src/lib/seed/engagement-simulator.ts` — simulate realistic engagement patterns:
    - For each tweet, simulate likes, replies, reposts based on:
      - Author's follower count (more followers → more engagement)
      - Tweet quality proxy (random with power law — most tweets get few likes, some go viral)
      - Topic popularity (trending topics get more engagement)
      - Time decay (older tweets have accumulated more engagement)
    - Generate Engagement records: user_id, tweet_id, engagement_type, created_at
    - Update tweet counters: like_count, reply_count, repost_count
    - Simulate some negative signals: ~2% of engagements are "not_interested"
    - Log: `[SEED] Engagement simulation: ${totalEngagements} engagements across ${tweetCount} tweets`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13, 14)
  - **Blocks**: Task 16
  - **Blocked By**: Task 2 (DB schema)

  **Acceptance Criteria**:
  - [ ] Engagement counts follow power law (most tweets < 10 likes, few > 100)
  - [ ] All engagement types represented
  - [ ] Tweet counters match actual engagement records
  - [ ] Viewer has engagement history (needed for affinity scoring)

  **Commit**: YES (group 4)

- [ ] 16. Master Seed Script

  **What to do**:
  - Create `src/lib/seed/index.ts` — orchestrate full seeding pipeline:
    1. Insert 200 persona users into DB (from Task 5 definitions)
    2. Insert viewer user
    3. Generate follow graph (Task 13)
    4. Generate tweets via LLM (Task 14)
    5. Simulate engagements (Task 15)
    6. Set default algorithm_weights for viewer
    7. Log summary: total users, tweets, follows, engagements, time elapsed, LLM cost
  - Create `src/app/api/seed/route.ts` — API endpoint to trigger seeding (POST only, service role key required)
  - Add `seed` script to package.json: `bun run src/lib/seed/index.ts`
  - Support `--dry-run` flag that logs what would be created without DB writes
  - Support `--skip-llm` flag that uses pre-generated tweet fixtures for testing

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 13, 14, 15)
  - **Blocks**: Tasks 17, 20
  - **Blocked By**: Tasks 13, 14, 15

  **Acceptance Criteria**:
  - [ ] `bun run seed` completes without errors
  - [ ] DB contains 200+ users, 50K+ tweets, follow graph, engagements
  - [ ] `--dry-run` logs plan without writing to DB
  - [ ] Viewer user has algorithm_weights row with defaults

  **QA Scenarios**:
  ```
  Scenario: Full seed populates database
    Tool: Bash
    Steps:
      1. Run `bun run seed`
      2. Query user count, tweet count, follow count, engagement count
      3. Assert users >= 201, tweets >= 50000, follows >= 5000, engagements >= 100000
    Evidence: .sisyphus/evidence/task-16-seed.txt
  ```

  **Commit**: YES (group 4)
  - Message: `feat(seed): add synthetic network generator (personas, tweets, follow graph, engagement)`

### Wave 4: UI + API (After Waves 2 & 3)

- [ ] 17. Feed API Endpoint

  **What to do**:
  - Create `src/app/api/feed/route.ts` — GET endpoint:
    - Query params: `userId`, `limit` (default 50), `seenIds` (comma-separated)
    - Reads viewer's algorithm_weights from DB
    - Instantiates ranking pipeline via `createDefaultPipeline()`
    - Executes pipeline with FeedQuery
    - Returns JSON: `{ tweets: ScoredCandidate[], meta: { totalCandidates, pipelineMs, appliedWeights } }`
    - Each tweet in response includes `explanation: ScoreExplanation`
    - Log: `[FEED] Feed request: userId=${id}, limit=${limit}, pipeline=${ms}ms`
  - Handle errors: return 500 with error message, log stack trace

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 18)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 12 (pipeline), 16 (seed data)

  **Acceptance Criteria**:
  - [ ] `curl http://localhost:3000/api/feed?userId=viewer-1` returns ranked tweets
  - [ ] Response includes explanation per tweet
  - [ ] Response includes meta with timing info

  **Commit**: YES (group 5)

- [ ] 18. Algorithm Weights API + SSE Stream

  **What to do**:
  - Create `src/app/api/weights/route.ts`:
    - GET: return current algorithm_weights for userId
    - PUT: update algorithm_weights, return updated weights
  - Create `src/app/api/feed/stream/route.ts` — SSE endpoint:
    - Client connects with userId
    - When weights are updated (via PUT to /api/weights), push new feed ranking to connected clients
    - Use a simple in-memory pub/sub (no Redis needed for single-user demo)
    - Log: `[FEED] SSE stream: client connected for userId=${id}`
    - Log: `[FEED] SSE stream: pushing re-ranked feed (weights changed)`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 17)
  - **Blocks**: Task 21
  - **Blocked By**: Tasks 2 (schema), 3 (types)

  **Acceptance Criteria**:
  - [ ] GET /api/weights returns current weights
  - [ ] PUT /api/weights updates weights in DB
  - [ ] SSE stream pushes new feed when weights change

  **Commit**: YES (group 5)

- [ ] 19. Tweet Card Component

  **What to do**:
  - Create `src/components/tweet-card.tsx` — React component rendering a single tweet:
    - Author avatar (colored circle with initials), display name, @username, timestamp (relative: "2h ago")
    - Tweet content with proper line breaks
    - Engagement bar: like count, reply count, repost count icons with numbers
    - Tweet type indicator: reply arrow, quote border, repost icon
    - "Why this tweet?" expandable section showing ScoreExplanation (hidden by default)
    - Persona type badge (small colored tag: "founder", "journalist", etc.)
  - Style with Tailwind v4 (use `@theme` variables for brand colors)
  - Component should be a Server Component by default (no interactivity needed for display)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices", "vercel-composition-patterns"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 18, 21-24)
  - **Blocks**: Task 20
  - **Blocked By**: Task 3 (types)

  **Acceptance Criteria**:
  - [ ] Tweet card renders all fields (author, content, engagement counts, timestamp)
  - [ ] Persona type badge visible
  - [ ] "Why this tweet?" section expandable
  - [ ] Tailwind v4 CSS-first styling (no tailwind.config.js)

  **Commit**: YES (group 6)

- [ ] 20. Feed Page with Infinite Scroll

  **What to do**:
  - Create `src/app/page.tsx` — main feed page (Server Component shell):
    - Fetch initial feed from /api/feed
    - Render list of TweetCard components
    - Client component wrapper for infinite scroll (load more on scroll bottom)
    - SSE connection for live re-ranking when sliders change
    - Loading skeleton while feed loads
    - Empty state: "No tweets found. Try adjusting your algorithm settings."
  - Create `src/components/feed.tsx` — client component handling scroll + SSE:
    - `'use client'` directive
    - useEffect for SSE connection to /api/feed/stream
    - Intersection Observer for infinite scroll trigger
    - Smooth transition when feed re-ranks (animate reorder)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices", "vercel-composition-patterns"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 17, 19)
  - **Blocks**: Final verification
  - **Blocked By**: Tasks 17 (feed API), 19 (tweet card)

  **Acceptance Criteria**:
  - [ ] Feed page renders ranked tweets on load
  - [ ] Infinite scroll loads more tweets
  - [ ] SSE re-ranks feed when weights change (no page reload)
  - [ ] Loading skeleton shown during fetch

  **Commit**: YES (group 6)

- [ ] 21. Algorithm Control Panel (Sliders)

  **What to do**:
  - Create `src/components/algorithm-panel.tsx` — client component with sliders:
    - 4 main sliders (0.0 to 1.0): Recency, Popularity, Network Proximity, Topic Relevance
    - Each slider shows current value and label
    - "Reset to defaults" button
    - Debounced PUT to /api/weights on slider change (300ms debounce)
    - Visual feedback: slider thumb color changes based on value
    - Collapsible "Advanced" section with per-engagement-type weights (like, reply, repost, etc.)
  - Position: fixed sidebar on desktop (right side), or bottom sheet on narrow screens
  - Use `useActionState` for form submission (React 19 pattern)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices", "vercel-composition-patterns"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19, 20, 22-24)
  - **Blocks**: Final verification
  - **Blocked By**: Task 18 (weights API)

  **Acceptance Criteria**:
  - [ ] 4 sliders render with labels and current values
  - [ ] Moving a slider triggers PUT /api/weights (debounced)
  - [ ] Feed re-ranks after slider change
  - [ ] "Reset to defaults" works

  **Commit**: YES (group 6)

- [ ] 22. Score Breakdown / Explainability Panel

  **What to do**:
  - Create `src/components/score-breakdown.tsx` — expandable panel per tweet:
    - Horizontal bar chart showing contribution of each signal to total score
    - Bars: recencyScore, popularityScore, networkScore, topicScore (colored by signal type)
    - Negative signals shown as red bars (not_interested penalty)
    - Author diversity multiplier shown as a modifier badge
    - OON penalty shown if applicable
    - Total score prominently displayed
    - "This tweet is #N in your feed because..." plain-English summary
  - Triggered by clicking "Why this tweet?" on TweetCard

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19-21, 23-24)
  - **Blocks**: Final verification
  - **Blocked By**: Tasks 3 (types), 17 (feed API returns explanation data)

  **Acceptance Criteria**:
  - [ ] Bar chart shows per-signal contribution
  - [ ] Total score displayed
  - [ ] Plain-English explanation generated
  - [ ] Negative signals shown in red

  **Commit**: YES (group 6)

- [ ] 23. Profile Page

  **What to do**:
  - Create `src/app/profile/[username]/page.tsx` — user profile page:
    - Header: avatar, display name, @username, bio, persona type badge
    - Stats: follower count, following count, tweet count
    - Tab: "Tweets" showing user's tweets (most recent first)
    - Each tweet rendered with TweetCard component
    - "Follow/Unfollow" button (updates follows table, triggers feed re-rank)
  - Server Component for data fetching, Client Component for follow button

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19-22, 24)
  - **Blocks**: Final verification
  - **Blocked By**: Tasks 2 (schema), 19 (tweet card)

  **Acceptance Criteria**:
  - [ ] Profile page renders user info, stats, tweets
  - [ ] Follow/unfollow button works
  - [ ] Clicking author name on tweet card navigates to profile

  **Commit**: YES (group 6)

- [ ] 24. Layout + Navigation

  **What to do**:
  - Create `src/app/layout.tsx` — root layout:
    - Left sidebar: navigation (Home feed, Explore, Algorithm Settings)
    - Main content area (center)
    - Right sidebar: Algorithm Control Panel (Task 21)
    - X-like dark theme using Tailwind v4 `@theme` variables
    - Responsive: sidebar collapses on narrow screens
  - Create `src/components/sidebar.tsx` — navigation sidebar
  - Create `src/components/header.tsx` — top bar with app title "X Algorithm Lab"
  - Update `src/app/globals.css` with Tailwind v4 theme:
    ```css
    @import "tailwindcss";
    @theme {
      --color-bg: #000000;
      --color-surface: #16181c;
      --color-border: #2f3336;
      --color-text: #e7e9ea;
      --color-text-secondary: #71767b;
      --color-accent: #1d9bf0;
    }
    ```

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `["frontend-ui-ux", "vercel-react-best-practices", "vercel-composition-patterns", "web-design-guidelines"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19-23)
  - **Blocks**: Final verification
  - **Blocked By**: Task 1 (scaffolding)

  **Acceptance Criteria**:
  - [ ] Dark theme matching X's aesthetic
  - [ ] Left sidebar with navigation links
  - [ ] Right sidebar with algorithm panel
  - [ ] Tailwind v4 `@theme` block in globals.css (no tailwind.config.js)
  - [ ] `@import "tailwindcss"` (not `@tailwind` directives)

  **Commit**: YES (group 6)
  - Message: `feat(ui): add feed, profile, algorithm controls, explainability UI`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bunx tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod (allow `[RANK]`/`[SEED]`/`[FEED]` tagged logs), commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for UI, `dev-browser` skill)
  Start from clean state (`bun run seed` then `bun dev`). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: seed → feed → sliders → re-rank → explainability. Test edge cases: empty follow list, all sliders at 0, all sliders at max. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT Have" compliance (no auth, no DMs, no notifications, no end-to-end neural ranking — Two-Tower engagement prediction is allowed). Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Files | Pre-commit |
|------|--------|---------|-------|------------|
| 1 | 1 | `chore(init): scaffold Next.js 16 + Supabase + vitest project` | package.json, tsconfig, next.config, supabase/ | `bunx tsc --noEmit` |
| 1 | 2 | `feat(schema): add database schema for users, tweets, follows, engagements` | supabase/migrations/, src/lib/types/ | `bunx tsc --noEmit` |
| 2 | 3 | `feat(pipeline): implement ranking pipeline (sources, hydrators, filters, scorers, selector)` | src/lib/ranking/ | `bun test` |
| 3 | 4 | `feat(seed): add synthetic network generator (personas, tweets, follow graph, engagement)` | src/lib/seed/, persona configs | `bun run seed --dry-run` |
| 4 | 5 | `feat(api): add feed + weights API endpoints with SSE` | src/app/api/ | `bun test` |
| 4 | 6 | `feat(ui): add feed, profile, algorithm controls, explainability UI` | src/app/, src/components/ | `bunx tsc --noEmit` |
| FINAL | 7 | `test(qa): add final verification evidence` | .sisyphus/evidence/ | — |

---

## Success Criteria

### Verification Commands
```bash
# Build passes
bunx tsc --noEmit  # Expected: no errors

# Tests pass
bun test  # Expected: all tests pass

# Seed populates database
bun run seed  # Expected: 200+ users, 50K+ tweets, follow graph created

# Feed returns ranked results
curl -s http://localhost:3000/api/feed?userId=viewer-1 | jq '.tweets | length'
# Expected: > 0

# Sliders produce different rankings
FEED_A=$(curl -s 'http://localhost:3000/api/feed?userId=viewer-1&recency=1.0&popularity=0.0' | jq '[.tweets[].id]')
FEED_B=$(curl -s 'http://localhost:3000/api/feed?userId=viewer-1&recency=0.0&popularity=1.0' | jq '[.tweets[].id]')
[ "$FEED_A" != "$FEED_B" ] && echo "PASS"
# Expected: PASS

# Author diversity enforced
curl -s http://localhost:3000/api/feed?userId=viewer-1 | jq '[.tweets[:20] | group_by(.authorId) | .[] | length] | max'
# Expected: <= 3

# Explainability data present
curl -s http://localhost:3000/api/feed?userId=viewer-1 | jq '.tweets[0].explanation | keys'
# Expected: contains recencyScore, popularityScore, networkScore, totalScore

# Dev server runs
bun dev  # Expected: Next.js starts on localhost:3000
```

### Final Checklist
- [ ] All "Must Have" items present and functional
- [ ] All "Must NOT Have" items absent from codebase
- [ ] All tests pass (`bun test`)
- [ ] TypeScript compiles (`bunx tsc --noEmit`)
- [ ] Seed script runs successfully
- [ ] Feed renders with ranked tweets
- [ ] Sliders change feed ordering in real-time
- [ ] Score breakdown visible per tweet
- [ ] No `as any`, no `@ts-ignore`, no empty catches
- [ ] Server-side logs use `[RANK]`, `[SEED]`, `[FEED]` prefixes

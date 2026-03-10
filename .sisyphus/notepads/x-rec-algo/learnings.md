# X Recommendation Algorithm - Learnings

## Project Initialization (March 10, 2026)

### Setup Completed
- **Next.js 16.1.6** initialized with App Router, TypeScript, Tailwind CSS v4
- **Bun v1.3.5** as package manager (installed 433 packages in 99.66s)
- **Tailwind CSS v4** configured with CSS-first approach:
  - `@import "tailwindcss"` in globals.css (NOT `@tailwind base/components/utilities`)
  - Theme variables via `@theme {}` block in CSS (NOT tailwind.config.js)
  - PostCSS uses `@tailwindcss/postcss` plugin
  - No autoprefixer needed (built into v4)

### Directory Structure
```
src/
  app/
    api/
    globals.css
    layout.tsx
    page.tsx
  lib/
    ranking/
      index.ts
    seed/
      index.ts
      topics.ts (pre-existing from prior session)
    types/
      index.ts
  components/
training/
  __init__.py
  requirements.txt
models/
  .gitkeep
```

### Dependencies Installed
**Core:**
- next@16.1.6
- react@19.2.4
- react-dom@19.2.4
- @supabase/supabase-js@2.99.0
- @supabase/ssr@0.5.2
- @google/generative-ai@0.21.0
- onnxruntime-node@1.24.3

**Dev:**
- typescript@5.9.3
- tailwindcss@4.2.1
- @tailwindcss/postcss@4.2.1
- vitest@4.0.18
- @testing-library/react@16.3.2
- playwright@1.58.2
- eslint@9.39.4

### Verification Results
✓ `bun install` → 433 packages installed (exit 0)
✓ `bunx tsc --noEmit` → Zero errors
✓ `bun dev` → Next.js 16.1.6 (Turbopack) started on localhost:3000 in 3.1s

### Key Configuration Files
- `package.json` - Scripts: dev, build, start, lint, seed, test, test:watch
- `tsconfig.json` - Strict mode, path aliases (@/* → src/*)
- `next.config.ts` - Includes logging convention comments
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin
- `.env.local.example` - Template for Supabase and Gemini API keys
- `.gitignore` - Excludes node_modules, .next, .env.local, models/*.onnx, etc.

### Notes for Next Tasks
- `src/lib/seed/topics.ts` was pre-existing from a prior session (contains 25 topic categories with keywords)
- Next.js auto-configured tsconfig.json on first dev run (added allowJs, incremental, .next/types)
- All logging conventions documented in next.config.ts comments: [RANK], [SEED], [FEED], [EMBED], [API]

## Engagement Simulator (Task 15 - March 10, 2026)

### Implementation Details
- **Power law distribution**: Inverse transform `floor(U^(-1/alpha) - 1)` with alpha=1.5. Produces heavy tail — most tweets 0-10 engagements, rare tweets 100-1000+.
- **Engagement probability factors**: follower_tier multiplier (mega=10x, macro=4x, mid=1.5x, micro=1x), trending topic boost (1.5x), follow relationship (3x), homophily (2x same persona_type), shared interest (1.5x), time decay (linear from 1.0 to 0.3 over 30 days), 1% random viral chance.
- **Type distribution**: likes 60%, clicks 20%, replies 10%, reposts 5%, follow_author 3%, not_interested 2%.
- **Viewer engagement**: Dedicated `generateViewerEngagements()` produces 500-1000 engagements with 70/30 preferred/other split. Preferred = ai/tech/startups topics + founder/tech personas + followed accounts.
- **Deduplication**: Uses `user_id:tweet_id:engagement_type` composite key to match DB UNIQUE constraint.
- **Counters**: Only like/reply/repost/click increment TweetCounters; follow_author and not_interested don't.

### Patterns
- `selectEngagingUsers` uses weighted sampling without replacement (same pattern as `follow-graph.ts`)
- Section divider comments (`// ─── Section ───`) are an established codebase convention
- Test file at `src/lib/seed/__tests__/engagement-simulator.test.ts` — 10 tests covering power law shape, type distribution, counter consistency, viewer history, timestamp validity, deduplication
- Total tests: 70 (60 existing + 10 new)

## Task 14: Tweet Generation Infrastructure (March 10, 2026)

### Approach: Programmatic Template Generation
- Rejected LLM API calls in favor of template-based generation (zero cost, deterministic, reproducible)
- SeededRandom class using xorshift32 provides deterministic output per persona (seed = username string)
- Template arrays (45-50 per persona type) × variable substitution from V banks = sufficient diversity for 250 tweets/persona

### Architecture
- `tweet-generator.ts`: Pure TS module, exports `generateTweetsForPersonas(personas, topics, 250)`
- `generate-batches.ts`: CLI script, splits 200 personas into 10 batches × 5K tweets = 50K total
- `load-generated-tweets.ts`: Runtime loader using `fs.readdirSync` + `fs.readFileSync`
- Generated files: `src/lib/seed/generated/batch-01.json` through `batch-10.json` (~2-3MB each)

### Template System
- Variable placeholders `{VAR_NAME}` filled from V banks (metrics, tickers, names, etc.)
- Per-persona-type templates ensure distinct voices (meme = lowercase/emoji, journalist = formal/breaking, trader = tickers/NFA)
- INTEREST_TO_TOPIC mapping handles non-standard interest keys (economics → finance, history → social_commentary)
- Tweets truncated at 277 chars + `...` if template fills exceed 280 chars

### Tweet Distribution
- 70% original, 15% reply, 10% quote, 5% repost
- created_at_offset_hours: 40% last 24h, 25% 24-72h, 35% 72-168h
- parent_ref = username from same persona pool (realistic interactions)

### Testing
- 10 tests in `src/lib/seed/__tests__/tweet-generation.test.ts`
- Tests: count ≥ 45K, type distribution, all topic ids valid, 280-char limit, all personas represented, per-persona counts

### Gotchas
- `__dirname` works in Bun scripts and is needed for cross-platform path resolution in loader
- `generate-batches.ts` uses `mkdirSync({ recursive: true })` in case directory doesn't exist
- Template index `i % templates.length` cycles through all templates evenly before repeating

## Task 16: Master Seed Script (March 10, 2026)

### Architecture Decisions

- **Two-pass tweet insertion**: First pass assigns UUIDs and collects `authorTweetIds` map, second pass resolves `parent_ref` (username) to a random tweet UUID from that author. Required because parent tweets need to exist before resolution.
- **Follow graph username→UUID conversion**: `generateFollowGraph` returns `FollowRecord` with usernames as `follower_id`/`following_id` for persona-to-persona pairs, but actual viewer UUID for viewer rows. Must check `=== VIEWER_ID` before mapping.
- **Deletion order**: Supabase FK constraints require deleting child tables first: `engagements` → `follows` → `tweets` → `users`. `follows` table has no `id` column — use `.gte('created_at', '1970-01-01')` for delete-all fallback.
- **Embedding model**: Used `text-embedding-004` with `outputDimensionality: 1536` instead of `embedding-001`. The legacy `embedding-001` only outputs 768-dim; DB schema is `vector(1536)` requiring the newer model with Matryoshka support.
- **Counter updates**: Two separate passes — tweet engagement counters (like/reply/repost/click) updated from `simulateEngagements` result; user follower/following counts updated from `generateFollowGraph` result.

### Patterns
- `batchInsert` helper with configurable `batchSize=1000` prevents Supabase row limit rejections
- `--dry-run` flag exits early after logging expected counts; `--skip-embeddings` bypasses Gemini calls
- API route (`src/app/api/seed/route.ts`) uses `Bearer ${serviceKey}` auth check to prevent public access
- Section dividers (`// ─── Name ───`) are the established codebase convention for long files

### Gotchas
- `follows` table has no `id` column (composite PK: follower_id + following_id) — `.delete().neq('id', ...)` fails; use `.delete().gte('created_at', '1970-01-01')` instead
- Supabase `createClient` for seed scripts uses `@supabase/supabase-js` directly (NOT `@supabase/ssr`) — server-side script doesn't need cookie/auth adapter
- `personas` export is lowercase (`export const personas`) not `PERSONAS`
- `generateFollowGraph` signature: `(personas: Persona[], viewerUserId: string)` — no options param

## Task 9: Two-Tower Neural Network (March 10, 2026)

### Architecture
- **User Tower**: Embedding(n_users+1, 64, padding_idx=0) → Linear(64→64) → ReLU → Linear(64→32) → user_vector
- **Tweet Tower**: Linear(9→64) → ReLU → Linear(64→32) → tweet_vector
- **Interaction**: dot product (sum of element-wise) → expand to 6 tasks + per-task bias → sigmoid
- **Loss**: BCELoss (multi-task, one loss per engagement type)
- 1-indexed user/topic mappings (index 0 = padding)

### Python Environment
- Python 3.14.3 on macOS Homebrew requires a venv (`training/.venv/`)
- `pip3 install --break-system-packages` blocked by Homebrew; use `python3 -m venv training/.venv` first
- Installed: torch 2.10.0, onnx 1.20.1, onnxruntime 1.24.3, numpy 2.4.3, psycopg2-binary 2.9.11
- Both `two_tower.py` and `export_onnx.py` insert venv path via `sys.path.insert` for portability
- requirements.txt now uses unpinned versions (latest compatible for Python 3.14)

### ONNX Export
- opset_version=17 works with torch 2.10.0 + onnx 1.20.1
- dynamic_axes on batch dimension → model handles any batch size
- Input names: `user_id` (int64), `tweet_features` (float32, shape [batch, 9])
- Output name: `engagement_probs` (float32, shape [batch, 6])
- Max diff PyTorch vs ONNX: < 0.001 (typically ~1e-7)
- `torch.load(..., weights_only=False)` needed for custom checkpoint dict with non-tensor values

### TypeScript ONNX Inference
- `onnxruntime-node` loaded via dynamic `import('onnxruntime-node')` to avoid ESM issues
- Int64 tensor for user_id uses `BigInt64Array` → `new ort.Tensor('int64', bigIntArr, [n])`
- All candidates batched into a single inference call (not per-candidate) for efficiency
- ONNX session cached at module scope via `onnxResources` + `onnxLoadAttempted` flags
- Falls back to heuristic silently when `models/two_tower.onnx` or `feature_config.json` missing

### Feature Encoding (must match Python exactly)
- `age_hours_divisor = 168` (1 week normalization)
- Engagement counts: `Math.log1p()` (matches Python `math.log1p`)
- is_reply/is_quote: float 0.0 or 1.0 from tweet_type string
- topic_to_idx and user_to_idx loaded from feature_config.json at inference time

## Task 9 Verification Pass (March 10, 2026)

### Status: All files pre-existing from prior session
All three deliverables were already implemented:
- `training/two_tower.py` — PyTorch training with Supabase Postgres via psycopg2, CPU-only, early stopping
- `training/export_onnx.py` — ONNX export with opset 17 + PyTorch/ONNX diff verification (< 0.001)
- `src/lib/ranking/scorers/engagement-predictor.ts` — ONNX inference + heuristic fallback (already fully upgraded)

### New Tests Added (82 total, was 80)
Added 2 new tests to `src/lib/ranking/__tests__/scorers.test.ts`:
1. Determinism: same input → same output (verifies heuristic is stateless for same timestamp)
2. Heuristic fallback: asserts click=0.1, not_interested=0.05 (heuristic constants)

### requirements.txt
Added `python-dotenv` for optional `.env.local` loading in training scripts.

### Verification
- `bunx tsc --noEmit` → clean
- `bun test` → 82 pass, 0 fail

## Task 20: ScoreBreakdown Component (March 10, 2026)

### Architecture
- Pure Server Component (no "use client") — static display, no interactivity
- Props: `{ explanation: ScoreExplanation; rank: number; inNetwork: boolean }`
- Dual export: named `ScoreBreakdown` + default export

### Visual Structure
1. Header: rank (#N in `#1d9bf0`) + total score (4 decimal places)
2. Plain-English summary: generated from `buildSummary()` — ranks 4 signals, picks top 2, adds network context
3. Signal bars: horizontal CSS bars proportional to max signal value (min denominator 0.001 to avoid div/0)
4. Predicted engagement: 2-col grid, `not_interested` shown red if > 0
5. Modifiers: author diversity badge always shown, OON badge only if < 1.0

### Gotchas
- Pre-existing TS error in `tweet-card.tsx` (EngagementButton unused) — not caused by this task
- `SIGNALS` constant was scaffolded but replaced by inline array in component — removed to keep clean
- Bar width uses `Math.min(100, ...)` to clamp at 100% in case of float edge cases

### Verification
- `bunx tsc --noEmit` → 0 new errors (pre-existing error in tweet-card.tsx unrelated)
- `bun test` → 82 pass, 0 fail
- LSP diagnostics on new file → clean

## Task 19: AlgorithmPanel Component (March 10, 2026)

### Implementation Pattern: Ref Mirror for Debounced Saves
- `pendingRef` mirrors the latest weight state alongside `useState`
- Debounce timer reads from `pendingRef.current` (not from state), avoiding stale closure issues
- This pattern is required when a `setTimeout` callback needs the most recent value — React state inside a closure captures the value at closure creation time

### Slider Styling
- Native `<input type="range">` with `appearance: none` + inline `linear-gradient` for fill effect
- Pseudo-element CSS (`::webkit-slider-thumb`, `::moz-range-thumb`) injected via JSX `<style>` tag scoped with class `.algo-panel-range`
- React 19 supports `<style>` tags in JSX (they're deduped and hoisted in RSC contexts)
- `accentColor` style property not needed when using custom thumb via pseudo-elements

### Component Architecture
- Single `WeightState` interface holds all 4 main + 6 engagement weights
- Both named export and default export provided
- `cloneDefaultState()` helper creates fresh copies (avoids shared reference bugs on reset)
- `isMounted` ref guards all async operations and `setSaveStatus` calls after unmount

### Pre-existing tsc Error
- `tweet-card.tsx:234` has `TS6133: 'EngagementButton' is declared but never read` — pre-existing before Task 19
- My file `algorithm-panel.tsx` has zero LSP diagnostics
- 82 tests still pass

## Task 2: App Shell Layout (March 10, 2026)

### Implementation
- `globals.css`: Rewrote with Tailwind v4 `@theme` dark variables — `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-accent`, etc. These become utility classes: `bg-bg`, `text-text`, `border-border`, `text-accent`, etc.
- `layout.tsx`: 3-column flex layout inside `max-w-[1265px]` centered wrapper. Left nav `w-[68px] xl:w-[275px]`, center `flex-1 max-w-[600px]`, right `w-[350px] hidden lg:block`. Both side columns use `border-r`/`border-l border-border`.
- `sidebar.tsx`: Server Component. Sticky `h-screen` nav. Icons are inline SVGs. Nav items use `flex gap-4 px-4 py-3 rounded-full hover:bg-surface`. Icon labels hidden below `xl` breakpoint.
- `header.tsx`: Server Component. Sticky top with `bg-bg/80 backdrop-blur-sm border-b border-border`.

### Pre-existing Bug Fixed
- `tweet-card.tsx` had unused `EngagementButton` function causing `TS6133` error. Removed the dead code (function + interface). The component renders inline buttons instead.

### Patterns
- Right sidebar `<aside id="algorithm-panel">` is an empty placeholder — AlgorithmPanel will be portal'd or rendered by the feed page
- Sidebar icon spans hidden at small/medium viewports with `hidden xl:block` on label text
- `bg-bg/80` opacity syntax works in Tailwind v4 with `@theme` CSS variables

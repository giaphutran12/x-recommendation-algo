# 5 Independent UI Versions — X Algorithm Lab

## TL;DR

> **Quick Summary**: Build 5 completely independent frontend UI versions (V1-V5) of the X Algorithm Lab, preserve current code as V0, and add a floating version switcher for instant comparison. Each version is built by a different agent with different skills/models — no cross-pollination.
> 
> **Deliverables**:
> - V0 preserved at `/` (current code, moved to route group)
> - V1 at `/v1` (Opus ultrabrain, Vercel skills)
> - V2 at `/v2` (Opus deep, Vercel skills)
> - V3 at `/v3` (Sonnet visual-engineering, Vercel skills)
> - V4 at `/v4` (Opus deep, Vercel + frontend-ui-ux skill)
> - V5 at `/v5` (Sonnet unspecified-high, Vercel + frontend-ui-ux skill)
> - Floating version switcher on all pages
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 (scaffold) → Task 2 (switcher) → Tasks 3-7 (versions, parallel) → Task 8 (verify)

---

## Context

### Original Request
User wants to compare 5 completely independent UI implementations of the same X/Twitter clone app. Each version is built from scratch by a different agent configuration (different model + skills), with zero cross-pollination. A floating version switcher enables instant A/B comparison.

### Research Findings
- **X/Twitter Design Specs**: Pixel-level reference compiled from `ccrsxx/twitter-clone` (937★) — exact colors (#000000 bg, #E7E9EA text, #1D9BF0 accent), typography (15px/700 display name, 15px/400 body), layout (288px sidebar, ~600px feed, 384px aside), tweet card anatomy (48px avatar, 16px padding, 12px gap)
- **Version Isolation**: CSS variable overrides per layout div — shadcn components automatically cascade. Each version's `layout.tsx` wraps children in a themed container.
- **File Structure**: `src/app/v{N}/` with co-located `_components/` (Next.js private folder convention). V0 moves to `(v0)/` route group to keep `/` URL.
- **API Contract**: 4 endpoints shared across all versions — `/api/feed` (GET), `/api/feed/stream` (SSE), `/api/weights` (GET/PUT). All types in `src/lib/types/`.

### User Notes
- Uses Wispr Flow (speech-to-text) — infer intent from imprecise phrasing
- "Chat CNUI" = shadcn/ui, "Nitesh" = Playwright
- Algorithm backend is working great — this is purely frontend

---

## Work Objectives

### Core Objective
Create 5 independent UI versions of the X Algorithm Lab frontend for side-by-side comparison, each built by a different agent configuration to explore design diversity.

### Concrete Deliverables
- 6 accessible routes: `/`, `/v1`, `/v2`, `/v3`, `/v4`, `/v5`
- Each with: layout, sidebar, header, feed (with infinite scroll + SSE), tweet cards, algorithm panel, profile page, follow button
- Floating version switcher component on all pages
- All versions pass `tsc --noEmit` with zero errors
- All 82 existing tests still pass

### Definition of Done
- [ ] `bunx tsc --noEmit` → 0 errors
- [ ] `bun test` → 82/82 pass
- [ ] Playwright screenshots of all 6 versions confirm rendering
- [ ] Version switcher navigates between all 6 versions
- [ ] Feed loads tweets in each version
- [ ] Algorithm panel sliders work in each version
- [ ] Profile pages render in each version

### Must Have
- Complete isolation between versions (no shared UI components except shadcn/ui)
- All 8 components implemented per version (layout, sidebar, header, feed, tweet-card, algorithm-panel, profile page, follow-button)
- SSE re-ranking works in each version
- Infinite scroll works in each version
- "Update Feed" button (dirty state tracking) in each version
- Score breakdown / "Why this tweet?" in each version

### Must NOT Have (Guardrails)
- NO cross-pollination: V2 agent must NOT read V1 code
- NO `as any` or `@ts-ignore`
- NO modifications to API routes (`src/app/api/`)
- NO modifications to ranking pipeline (`src/lib/ranking/`)
- NO modifications to shared types (`src/lib/types/`)
- NO modifications to seed data (`src/lib/seed/`)
- NO new npm dependencies (use what's already installed)
- NO changes to test files

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Vitest v4, 82 tests)
- **Automated tests**: Tests-after (no new unit tests for UI versions — visual verification via Playwright)
- **Framework**: Vitest (existing) + Playwright (screenshots)

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright screenshots — navigate, wait for content, capture
- **TypeScript**: `bunx tsc --noEmit` — zero errors
- **Tests**: `bun test` — 82/82 pass

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — must complete first):
├── Task 1: Scaffold V0 migration + root layout + directory structure [quick]
├── Task 2: Version switcher component [quick]

Wave 2 (All 5 versions — MAX PARALLEL):
├── Task 3: Build V1 (Opus ultrabrain, Vercel skills) [ultrabrain]
├── Task 4: Build V2 (Opus deep, Vercel skills) [deep]
├── Task 5: Build V3 (Sonnet visual-engineering, Vercel skills) [visual-engineering]
├── Task 6: Build V4 (Opus deep, Vercel + frontend-ui-ux) [deep]
├── Task 7: Build V5 (Sonnet unspecified-high, Vercel + frontend-ui-ux) [unspecified-high]

Wave 3 (Verification — after all versions complete):
├── Task 8: TypeScript check + test suite [quick]
├── Task 9: Playwright visual verification of all 6 versions [unspecified-high]

Wave FINAL (Review):
├── Task F1: Plan compliance audit [deep]
├── Task F2: Scope fidelity check [deep]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|---|---|---|
| 1 (scaffold) | — | 2, 3, 4, 5, 6, 7 |
| 2 (switcher) | 1 | 3, 4, 5, 6, 7 |
| 3 (V1) | 1, 2 | 8, 9 |
| 4 (V2) | 1, 2 | 8, 9 |
| 5 (V3) | 1, 2 | 8, 9 |
| 6 (V4) | 1, 2 | 8, 9 |
| 7 (V5) | 1, 2 | 8, 9 |
| 8 (tsc+test) | 3, 4, 5, 6, 7 | F1, F2 |
| 9 (screenshots) | 3, 4, 5, 6, 7 | F1, F2 |
| F1 (audit) | 8, 9 | — |
| F2 (scope) | 8, 9 | — |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|---|---|---|
| 1 | 2 | T1 → `quick`, T2 → `quick` |
| 2 | 5 | T3 → `ultrabrain`, T4 → `deep`, T5 → `visual-engineering`, T6 → `deep`, T7 → `unspecified-high` |
| 3 | 2 | T8 → `quick`, T9 → `unspecified-high` |
| FINAL | 2 | F1 → `deep`, F2 → `deep` |

---

## TODOs

- [ ] 1. Scaffold V0 Migration + Root Layout + Directory Structure

  **What to do**:
  - Move current `src/app/page.tsx` and `src/app/profile/` into a `(v0)` route group so current code stays at `/`
  - Create `src/app/(v0)/layout.tsx` that contains the current 3-column layout (sidebar | main | algorithm-panel) — extract from root `layout.tsx`
  - Move `src/app/(v0)/page.tsx` (current home page)
  - Move `src/app/(v0)/profile/[username]/page.tsx` and `follow-button.tsx`
  - Update root `src/app/layout.tsx` to ONLY contain: html, body, font, TooltipProvider, VersionSwitcher — NO 3-column layout (that moves to each version's layout)
  - Create empty directory structure for V1-V5:
    ```
    src/app/v1/_components/  (empty, ready for version agent)
    src/app/v1/profile/[username]/  (empty)
    src/app/v2/_components/
    src/app/v2/profile/[username]/
    src/app/v3/_components/
    src/app/v3/profile/[username]/
    src/app/v4/_components/
    src/app/v4/profile/[username]/
    src/app/v5/_components/
    src/app/v5/profile/[username]/
    ```
  - Verify `/` still works (V0 renders correctly)
  - Run `bunx tsc --noEmit` to confirm zero errors after migration

  **Must NOT do**:
  - Do NOT modify any API routes
  - Do NOT modify any files in `src/lib/`
  - Do NOT modify `src/components/ui/` (shared shadcn)
  - Do NOT delete any existing components — move them

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Simple file moves and directory creation — no design skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete first)
  - **Parallel Group**: Wave 1 (sequential with Task 2)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None

  **References**:
  - `src/app/layout.tsx` — Current root layout to split (3-column layout moves to V0)
  - `src/app/page.tsx` — Current home page (moves to `(v0)/page.tsx`)
  - `src/app/profile/[username]/page.tsx` — Profile page (moves to `(v0)/profile/`)
  - `src/app/profile/[username]/follow-button.tsx` — Follow button (moves with profile)
  - `src/components/sidebar.tsx` — V0's sidebar (stays in `src/components/`, V0 layout imports it)
  - `src/components/feed.tsx` — V0's feed (stays in `src/components/`, V0 page imports it)
  - `src/components/header.tsx` — V0's header (stays in `src/components/`)
  - `src/components/algorithm-panel.tsx` — V0's algo panel (stays in `src/components/`)
  - `src/components/tweet-card.tsx` — V0's tweet card (stays in `src/components/`)
  - `src/components/score-breakdown.tsx` — V0's score breakdown (stays in `src/components/`)

  **Acceptance Criteria**:
  - [ ] `(v0)` route group exists with layout.tsx, page.tsx, profile/
  - [ ] Root layout.tsx only has html/body/font/providers — no 3-column layout
  - [ ] `/` still renders the current V0 UI correctly
  - [ ] Empty directory structure exists for v1-v5
  - [ ] `bunx tsc --noEmit` → 0 errors

  **QA Scenarios**:
  ```
  Scenario: V0 still renders at /
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000 /tmp/v0-after-migration.png
      2. Verify screenshot shows feed with tweets, sidebar, algorithm panel
    Expected Result: V0 UI unchanged after migration
    Evidence: .sisyphus/evidence/task-1-v0-renders.png

  Scenario: TypeScript clean
    Tool: Bash
    Steps:
      1. bunx tsc --noEmit
    Expected Result: Exit code 0, no errors
    Evidence: .sisyphus/evidence/task-1-tsc.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): scaffold V0 route group and version directory structure`
  - Files: `src/app/(v0)/*, src/app/layout.tsx, src/app/v1-v5/ (empty dirs)`

- [ ] 2. Version Switcher Component

  **What to do**:
  - Create `src/components/version-switcher.tsx` — a floating pill/tab bar
  - Position: `fixed bottom-4 left-1/2 -translate-x-1/2` (centered bottom, like a dock)
  - Z-index: `z-50` (above everything)
  - Design: dark glass card (`bg-[#16181C]/90 backdrop-blur-xl border border-[#2f3336] rounded-full`)
  - Contains 6 pill buttons: V0, V1, V2, V3, V4, V5
  - Each pill is a Next.js `<Link>` with `prefetch={true}` for instant transitions
  - Current version highlighted with `bg-[#1D9BF0] text-white`, others `text-[#71767B] hover:text-[#E7E9EA]`
  - Detect current version from `usePathname()`:
    - `/` or `/(v0)/*` → V0 active
    - `/v1/*` → V1 active
    - etc.
  - Add `'use client'` directive (needs usePathname)
  - Import and render in root `layout.tsx` (inside body, after TooltipProvider)
  - Must NOT interfere with page content (fixed positioning, pointer-events on pills only)

  **Must NOT do**:
  - Do NOT use any non-shadcn components
  - Do NOT add new dependencies
  - Do NOT make it too large — should be subtle and non-intrusive
  - Do NOT block interaction with page content below it

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`web-design-guidelines`]
    - `web-design-guidelines`: Ensures accessible focus states, proper contrast, keyboard navigation

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1)
  - **Parallel Group**: Wave 1 (after Task 1)
  - **Blocks**: Tasks 3, 4, 5, 6, 7
  - **Blocked By**: Task 1

  **References**:
  - `src/app/layout.tsx` — Where to render the switcher
  - `src/components/ui/button.tsx` — shadcn Button for pill styling (or just use plain links)
  - `src/lib/utils.ts` — `cn()` for conditional classes

  **Acceptance Criteria**:
  - [ ] `src/components/version-switcher.tsx` exists
  - [ ] Renders on all pages (visible in root layout)
  - [ ] Shows V0-V5 pills with correct active state
  - [ ] Links navigate to correct routes
  - [ ] `bunx tsc --noEmit` → 0 errors

  **QA Scenarios**:
  ```
  Scenario: Switcher visible on home page
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=5000 --viewport-size="1400,900" http://localhost:3000 /tmp/switcher-visible.png
      2. Verify bottom-center floating pill bar with V0-V5 labels
    Expected Result: Switcher visible, V0 highlighted
    Evidence: .sisyphus/evidence/task-2-switcher-visible.png
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(ui): add floating version switcher component`
  - Files: `src/components/version-switcher.tsx, src/app/layout.tsx`

- [ ] 3. Build V1 — Complete UI (Opus ultrabrain, Vercel skills only)

  **What to do**:
  Build a complete, independent X/Twitter clone UI at `/v1`. This is a from-scratch implementation — do NOT read or reference any code in `src/components/` (V0's components) or any other version's `_components/`.

  You must create ALL of these files:
  - `src/app/v1/layout.tsx` — 3-column layout (sidebar | feed | algorithm panel), dark theme
  - `src/app/v1/page.tsx` — Home page with header + feed + algorithm panel portal
  - `src/app/v1/_components/sidebar.tsx` — X logo, Home/Explore/Algorithm nav, responsive
  - `src/app/v1/_components/header.tsx` — Sticky "For You" with frosted glass
  - `src/app/v1/_components/feed.tsx` — Fetch /api/feed, infinite scroll, SSE /api/feed/stream, skeleton loading, empty state, re-rank banner
  - `src/app/v1/_components/tweet-card.tsx` — Avatar, author info, persona badge, tweet text, engagement bar, "Why this tweet?" collapsible with score breakdown
  - `src/app/v1/_components/algorithm-panel.tsx` — 4 main sliders + 6 engagement sliders, collapsible advanced, "Update Feed" button (dirty state), reset, save status. Fetch GET /api/weights on mount, PUT /api/weights on save.
  - `src/app/v1/profile/[username]/page.tsx` — Server component: fetch user + tweets + follow status from Supabase, render profile header + tweet list
  - `src/app/v1/profile/[username]/follow-button.tsx` — Client component: optimistic follow/unfollow via Supabase client

  **Design Reference** (X/Twitter "Lights Out" dark mode):
  - Main bg: #000000, Card bg: #16181C, Border: #2F3336
  - Text: #E7E9EA (primary), #71767B (secondary)
  - Accent: #1D9BF0 (blue), #F91A82 (like), #00B87A (retweet)
  - Tweet body: 15px/400/lh1.5, Display name: 15px/700, Username: 15px/400/#71767B
  - Avatar: 48x48px, Padding: 16px horiz / 12px vert, Avatar gap: 12px
  - Sidebar: 288px xl, 80px mobile, Nav icon: 28px, Logo: 28px #1D9BF0
  - Header: sticky top-0, rgba(0,0,0,0.6) + backdrop-blur(12px)
  - Engagement icons: 20px with 36px touch target, hover colored bg at 10% opacity
  - Feed max-width: ~600px

  **API Contract**:
  - GET `/api/feed?userId=00000000-0000-0000-0000-000000000001&limit=50` → `{ tweets: ScoredCandidate[], meta: { totalCandidates, pipelineMs, appliedWeights } }`
  - GET `/api/feed?userId=...&limit=50&seenIds=id1,id2` → same (pagination)
  - SSE `/api/feed/stream?userId=...` → events: `connected`, `feed` (re-ranked tweets)
  - GET `/api/weights?userId=...` → `{ weights: AlgorithmWeights }`
  - PUT `/api/weights` body: `{ user_id, recency_weight, popularity_weight, network_weight, topic_relevance_weight, engagement_type_weights, updated_at }` → `{ weights: AlgorithmWeights }`

  **Shared imports allowed**:
  - `@/components/ui/*` (shadcn components)
  - `@/lib/utils` (cn function)
  - `@/lib/types/*` (database, ranking types)
  - `lucide-react` (icons)
  - `@supabase/supabase-js` (for follow button)
  - `next/link`, `next/navigation`

  **Must NOT do**:
  - Do NOT import from `src/components/` (V0's components)
  - Do NOT import from `src/app/v2/`, `src/app/v3/`, etc.
  - Do NOT modify any files outside `src/app/v1/`
  - Do NOT use `as any` or `@ts-ignore`
  - Do NOT add new npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`vercel-react-best-practices`, `web-design-guidelines`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `src/lib/types/database.ts` — User, Tweet, AlgorithmWeights, PersonaType, EngagementType types
  - `src/lib/types/ranking.ts` — ScoredCandidate, ScoreExplanation, EngagementPredictions types
  - `src/components/ui/` — All shadcn components available (Slider, Button, Card, Badge, Collapsible, Tooltip, Skeleton, Spinner, Separator, etc.)
  - `src/lib/utils.ts` — cn() utility

  **Acceptance Criteria**:
  - [ ] All 9 files created in `src/app/v1/`
  - [ ] `/v1` renders feed with tweets after ~6s pipeline
  - [ ] Infinite scroll loads more tweets
  - [ ] Algorithm panel sliders work, "Update Feed" triggers SSE re-rank
  - [ ] `/v1/profile/{username}` renders profile with tweets
  - [ ] Follow button toggles state
  - [ ] `bunx tsc --noEmit` → 0 errors (for v1 files)

  **QA Scenarios**:
  ```
  Scenario: V1 feed loads
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000/v1 /tmp/v1-feed.png
      2. Verify tweets render with avatars, badges, engagement metrics
    Expected Result: Full feed visible with X dark theme
    Evidence: .sisyphus/evidence/task-3-v1-feed.png

  Scenario: V1 profile page
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=8000 --viewport-size="1400,900" http://localhost:3000/v1/profile/eliaszhou_ai /tmp/v1-profile.png
      2. Verify profile header, avatar, bio, tweet list
    Expected Result: Profile renders correctly
    Evidence: .sisyphus/evidence/task-3-v1-profile.png
  ```

  **Commit**: NO (groups with other versions in Wave 2 commit)

- [ ] 4. Build V2 — Complete UI (Opus deep, Vercel skills only)

  **What to do**:
  Identical scope to Task 3 but for `/v2`. Build a complete, independent X/Twitter clone UI. Do NOT read V1's code or any other version. Create all 9 files under `src/app/v2/`.

  Same design reference, API contract, shared imports, and constraints as Task 3.
  All files go under `src/app/v2/` with `_components/` for private components.

  **Must NOT do**: Same as Task 3 — no cross-version imports, no `as any`, no modifications outside `src/app/v2/`.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`vercel-react-best-practices`, `web-design-guidelines`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5, 6, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**: Same as Task 3 (shared types, shadcn components, utils)

  **Acceptance Criteria**: Same as Task 3 but for `/v2` routes.

  **QA Scenarios**:
  ```
  Scenario: V2 feed loads
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000/v2 /tmp/v2-feed.png
    Expected Result: Full feed visible
    Evidence: .sisyphus/evidence/task-4-v2-feed.png
  ```

  **Commit**: NO (groups with Wave 2)

- [ ] 5. Build V3 — Complete UI (Sonnet visual-engineering, Vercel skills only)

  **What to do**:
  Identical scope to Task 3 but for `/v3`. Built by Sonnet (visual-engineering category) — may produce a different aesthetic interpretation. Do NOT read any other version's code. Create all 9 files under `src/app/v3/`.

  Same design reference, API contract, shared imports, and constraints as Task 3.

  **Must NOT do**: Same as Task 3.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`vercel-react-best-practices`, `web-design-guidelines`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 6, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**: Same as Task 3.

  **Acceptance Criteria**: Same as Task 3 but for `/v3` routes.

  **QA Scenarios**:
  ```
  Scenario: V3 feed loads
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000/v3 /tmp/v3-feed.png
    Expected Result: Full feed visible
    Evidence: .sisyphus/evidence/task-5-v3-feed.png
  ```

  **Commit**: NO (groups with Wave 2)

- [ ] 6. Build V4 — Complete UI (Opus deep, Vercel + frontend-ui-ux skill)

  **What to do**:
  Identical scope to Task 3 but for `/v4`. This version loads the additional `frontend-ui-ux` skill — the agent should apply its design patterns (glassmorphism, micro-interactions, shimmer skeletons, etc.) on top of the X design reference. Do NOT read any other version's code. Create all 9 files under `src/app/v4/`.

  Same design reference, API contract, shared imports, and constraints as Task 3.
  The `frontend-ui-ux` skill encourages: visual polish, hover states, loading animations, whitespace, color contrast, responsive design.

  **Must NOT do**: Same as Task 3.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`vercel-react-best-practices`, `web-design-guidelines`, `frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 7)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**: Same as Task 3.

  **Acceptance Criteria**: Same as Task 3 but for `/v4` routes.

  **QA Scenarios**:
  ```
  Scenario: V4 feed loads
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000/v4 /tmp/v4-feed.png
    Expected Result: Full feed visible, potentially with enhanced visual polish
    Evidence: .sisyphus/evidence/task-6-v4-feed.png
  ```

  **Commit**: NO (groups with Wave 2)

- [ ] 7. Build V5 — Complete UI (Sonnet unspecified-high, Vercel + frontend-ui-ux skill)

  **What to do**:
  Identical scope to Task 3 but for `/v5`. Built by Sonnet (unspecified-high) with the `frontend-ui-ux` skill. Do NOT read any other version's code. Create all 9 files under `src/app/v5/`.

  Same design reference, API contract, shared imports, and constraints as Task 3.

  **Must NOT do**: Same as Task 3.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`vercel-react-best-practices`, `web-design-guidelines`, `frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5, 6)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 2

  **References**: Same as Task 3.

  **Acceptance Criteria**: Same as Task 3 but for `/v5` routes.

  **QA Scenarios**:
  ```
  Scenario: V5 feed loads
    Tool: Playwright
    Steps:
      1. npx playwright screenshot --wait-for-timeout=25000 --viewport-size="1400,900" http://localhost:3000/v5 /tmp/v5-feed.png
    Expected Result: Full feed visible
    Evidence: .sisyphus/evidence/task-7-v5-feed.png
  ```

  **Commit**: NO (groups with Wave 2)

- [ ] 8. TypeScript Check + Test Suite

  **What to do**:
  - Run `bunx tsc --noEmit` — must be 0 errors across ALL versions
  - Run `bun test` — must be 82/82 pass (existing tests unaffected)
  - If any errors, identify which version caused them and report

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F2
  - **Blocked By**: Tasks 3, 4, 5, 6, 7

  **Acceptance Criteria**:
  - [ ] `bunx tsc --noEmit` → 0 errors
  - [ ] `bun test` → 82/82 pass

  **Commit**: NO

- [ ] 9. Playwright Visual Verification of All 6 Versions

  **What to do**:
  - Take Playwright screenshots of all 6 versions (feed page + profile page each)
  - Screenshots:
    1. `http://localhost:3000` → `/tmp/final-v0.png` (wait 25s)
    2. `http://localhost:3000/v1` → `/tmp/final-v1.png` (wait 25s)
    3. `http://localhost:3000/v2` → `/tmp/final-v2.png` (wait 25s)
    4. `http://localhost:3000/v3` → `/tmp/final-v3.png` (wait 25s)
    5. `http://localhost:3000/v4` → `/tmp/final-v4.png` (wait 25s)
    6. `http://localhost:3000/v5` → `/tmp/final-v5.png` (wait 25s)
  - Verify each screenshot shows: sidebar, feed with tweets, algorithm panel, version switcher
  - Take one profile screenshot per version to verify profile pages work
  - Report any version that fails to render

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`web-design-guidelines`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1, F2
  - **Blocked By**: Tasks 3, 4, 5, 6, 7

  **Acceptance Criteria**:
  - [ ] 6 feed screenshots captured
  - [ ] All 6 show rendered content (not blank/error pages)
  - [ ] Version switcher visible in all screenshots

  **Commit**: YES
  - Message: `feat(ui): add V1-V5 independent UI versions with version switcher`
  - Files: all new files in src/app/v1-v5/, src/components/version-switcher.tsx

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `deep`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Scope Fidelity Check** — `deep`
  For each version: verify all 8 components exist and are functional. Check no version reads another version's `_components/`. Verify API routes untouched. Flag any unaccounted changes.
  Output: `Versions [N/N compliant] | Isolation [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- After Wave 1: `feat(ui): scaffold V0 migration and version switcher`
- After Wave 2: `feat(ui): add V1-V5 independent UI versions`
- After Wave 3: `chore: verify all versions pass tsc and tests`

---

## Success Criteria

### Verification Commands
```bash
bunx tsc --noEmit          # Expected: 0 errors
bun test                   # Expected: 82 pass, 0 fail
# Playwright screenshots of /, /v1, /v2, /v3, /v4, /v5
```

### Final Checklist
- [ ] All 6 routes accessible and rendering
- [ ] Version switcher visible and functional on all pages
- [ ] Feed loads tweets in each version
- [ ] Algorithm panel works in each version
- [ ] Profile pages render in each version
- [ ] Zero TypeScript errors
- [ ] All 82 tests pass
- [ ] No cross-version code sharing (except shadcn/ui)

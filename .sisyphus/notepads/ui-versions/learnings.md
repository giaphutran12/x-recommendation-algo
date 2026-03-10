# Learnings — UI Versions Plan

## [2026-03-10] Initial Context
- Root layout.tsx has 3-column layout (sidebar | main | algo panel) — must be extracted to V0 layout
- V0 components live in `src/components/` (sidebar, header, feed, tweet-card, algorithm-panel, score-breakdown)
- Profile page at `src/app/profile/[username]/page.tsx` + `follow-button.tsx`
- Home page at `src/app/page.tsx` — imports Header, Feed, AlgorithmPanelPortal
- shadcn components in `src/components/ui/` — 55 components installed
- Tailwind v4 CSS-first config — no tailwind.config.js
- Dev server running at localhost:3000

## V0 Route Group Migration (March 10, 2026)

### Completed Tasks
- ✅ Created `src/app/(v0)/` route group with 3-column layout extracted from root
- ✅ Migrated `src/app/page.tsx` → `src/app/(v0)/page.tsx`
- ✅ Migrated `src/app/profile/[username]/page.tsx` → `src/app/(v0)/profile/[username]/page.tsx`
- ✅ Migrated `src/app/profile/[username]/follow-button.tsx` → `src/app/(v0)/profile/[username]/follow-button.tsx`
- ✅ Stripped root `layout.tsx` to html/body/font/TooltipProvider only
- ✅ Created empty v1-v5 directory structure with `.gitkeep` files
- ✅ Verified `/` still renders V0 UI correctly (route group parentheses don't affect URL)
- ✅ TypeScript check: 0 errors

### Key Learnings
1. **Route Groups in Next.js**: Parentheses in route names (e.g., `(v0)`) don't affect the URL structure. The `/` route still renders the V0 layout and page.
2. **Layout Extraction**: The 3-column layout (sidebar | main | algo panel) was cleanly extracted from root layout into `(v0)/layout.tsx` without breaking imports.
3. **Import Resolution**: All `@/` imports in copied files resolve correctly from the new location—no path adjustments needed.
4. **Clean Root Layout**: Root layout now only handles HTML structure, fonts, and providers. All UI layout is delegated to route groups.

### Directory Structure
```
src/app/
├── (v0)/
│   ├── layout.tsx (3-column layout)
│   ├── page.tsx (home)
│   └── profile/[username]/
│       ├── page.tsx (profile)
│       └── follow-button.tsx
├── v1/ (empty, ready for V1 implementation)
├── v2/ (empty, ready for V2 implementation)
├── v3/ (empty, ready for V3 implementation)
├── v4/ (empty, ready for V4 implementation)
├── v5/ (empty, ready for V5 implementation)
├── api/ (unchanged)
├── layout.tsx (stripped to html/body/providers)
└── globals.css (unchanged)
```

### Next Steps
- V1-V5 can now be implemented in parallel without affecting V0
- Each version can have its own layout, components, and styling
- The root layout remains minimal and version-agnostic

## Version Switcher Component (March 10, 2026)

### Completed
- ✅ Created `src/components/version-switcher.tsx` with floating pill bar design
- ✅ Updated `src/app/layout.tsx` to import and render VersionSwitcher
- ✅ TypeScript check: 0 errors

### Implementation Details
- **Position**: Fixed at bottom center (`fixed bottom-4 left-1/2 -translate-x-1/2 z-50`)
- **Design**: Dark pill bar with X theme colors
  - Background: `bg-[#16181C]/90 backdrop-blur-xl`
  - Border: `border-[#2f3336]`
  - Shadow: `shadow-lg shadow-black/50`
- **Pills**: 6 navigation links (V0-V5)
  - Active: `bg-[#1D9BF0] text-white font-semibold`
  - Inactive: `text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#ffffff08]`
- **Active Detection**: Uses `usePathname()` to detect current version
  - V0: pathname === '/' or starts with '/(v0)'
  - V1-V5: pathname starts with '/v{n}'
- **Navigation**: Next.js `<Link>` with `prefetch={true}` for instant navigation

### Key Design Decisions
1. **Client Component**: Uses `'use client'` for `usePathname()` hook
2. **No shadcn Button**: Plain `<Link>` + Tailwind is sufficient for navigation pills
3. **Subtle & Non-Intrusive**: Fixed positioning at bottom doesn't block page content
4. **Responsive**: Uses Tailwind utilities for all styling (no custom CSS)

### Files Modified
- Created: `src/components/version-switcher.tsx`
- Updated: `src/app/layout.tsx` (added import + component render)

## V2 Implementation (March 10, 2026)

### Completed
- All 9 files created in `src/app/v2/`
- TypeScript: 0 errors in v2 files

### Key Patterns
- `CollapsibleTrigger` (base-ui) does NOT support `asChild` prop — render children directly inside it
- Slider `onValueChange` type is `(value: number | readonly number[], ...) => void` — must handle both number and array
- `AlgorithmPanelPortal` uses `createPortal` + `useEffect` to find `#v2-algorithm-panel` DOM node
- Profile page `params` must be awaited: `const { username } = await params` (Next.js 16)
- Supabase client in Server Components: `createClient` from `@supabase/supabase-js` with env vars
- SSE via native `EventSource`, listen for named `feed` events

### Architecture
- `layout.tsx`: 3-col (sidebar 68px/275xl | main | aside#v2-algorithm-panel 350-390px)
- `page.tsx`: Header + Feed + AlgorithmPanelPortal (portal renders into layout aside)
- Feed: initial fetch → skeletons → tweet cards → IntersectionObserver infinite scroll
- Algorithm panel: fetches weights on mount, tracks dirty state, saves via PUT /api/weights

## V4 Implementation (March 10, 2026)

### Completed
- ✅ All 9 files created in `src/app/v4/`
- ✅ TypeScript check: 0 errors

### Key Technical Findings

1. **CollapsibleTrigger (base-ui)**: No `asChild` prop — it renders as a native button by default. Pass className directly to style it. Do NOT wrap with `asChild`.

2. **Slider onValueChange (base-ui)**: Type is `(value: number | readonly number[], eventDetails) => void` — NOT `(value: number[]) => void`. Must handle both `number` and `readonly number[]`:
   ```ts
   onValueChange={(vals: number | readonly number[]) => {
     const arr = Array.isArray(vals) ? vals : [vals];
     if (arr[0] !== undefined) onValueChange(arr[0] as number);
   }}
   ```

3. **AlgorithmPanel Portal**: Uses `createPortal` to render into `#v4-algorithm-panel` div in layout. Portal target must be found via `useEffect` (client-side only). Returns null until mounted.

4. **Feed SSE**: `EventSource` for `/api/feed/stream?userId=...` — listens for `"feed"` events to set dirty state. Close on cleanup.

5. **Infinite scroll**: Uses `IntersectionObserver` on a sentinel div at the bottom. Pagination via `seenIds` query param (comma-separated tweet IDs).

6. **Profile params**: `params` is a `Promise<{ username: string }>` in Next.js 16 — must `await params`.

## V3 Implementation (March 10, 2026)

### Files Created (all 9)
- `src/app/v3/layout.tsx` — 3-column sticky layout (68px/275px sidebar, 620px feed, 350px algo panel)
- `src/app/v3/page.tsx` — Home page importing Header, Feed, AlgorithmPanel
- `src/app/v3/_components/sidebar.tsx` — X logo SVG, 7 nav items, usePathname active state
- `src/app/v3/_components/header.tsx` — Frosted glass sticky header with For You / Following tabs
- `src/app/v3/_components/feed.tsx` — Fetch/skeleton/infinite scroll/SSE/dirty banner/re-fetch
- `src/app/v3/_components/tweet-card.tsx` — Avatar, badges, engagement bar, Collapsible score breakdown
- `src/app/v3/_components/algorithm-panel.tsx` — Portal into #v3-algorithm-panel, 4+6 sliders, PUT /api/weights
- `src/app/v3/profile/[username]/page.tsx` — Server component with Supabase queries
- `src/app/v3/profile/[username]/follow-button.tsx` — Optimistic follow/unfollow

### Key Patterns
1. **@base-ui Slider onValueChange type** is `number | readonly number[]`, NOT just `number[]`. Fix: `onValueChange={(val) => fn(Array.isArray(val) ? val[0] : val)}`
2. **@base-ui Collapsible**: `open` + `onOpenChange={(open) => setState(open)}`. CollapsibleTrigger renders as `<button>` — no need for `asChild`. CollapsibleContent is `Panel` internally.
3. **Algorithm panel portal**: Use `useEffect(() => setPortalEl(document.getElementById('v3-algorithm-panel')), [])` to avoid SSR `document` errors. Return null until mounted.
4. **Cross-component communication** (feed ↔ algo panel through portal): `window.dispatchEvent(new Event('v3:weights-saved'))` + `window.addEventListener` in feed component.
5. **SSE custom events**: `es.addEventListener('feed', (e: Event) => { const event = e as MessageEvent; ... })` — cast from Event to MessageEvent for custom event names.
6. **IntersectionObserver** for infinite scroll: observe a sentinel div at the bottom; deps `[isLoadingMore, isInitialLoading, hasMore, fetchFeed]`.
7. **Profile params** in Next.js 16: `params: Promise<{ username: string }>` + `const { username } = await params`
8. **TypeScript clean**: Exit 0, no `as any` or `@ts-ignore` used.

### Design Token Summary
- Main bg: `#000000`, hover bg: `#080808`
- Card/panel bg: `#16181C`
- Border: `#2F3336`
- Primary text: `#E7E9EA`, Secondary text: `#71767B`
- Blue: `#1D9BF0`, Pink/like: `#F91A82`, Green/repost: `#00B87A`
- Sidebar: `w-[68px] xl:w-[275px]`, Feed: `max-w-[620px]`, Panel: `w-[350px]`

## V1 Implementation (March 10, 2026)

### Files Created (all 9)
- `src/app/v1/layout.tsx` — 3-col (w-20/xl:w-72 sidebar, max-w-[600px] feed, hidden lg:w-[350px]/xl:w-[390px] algo panel #v1-algorithm-panel)
- `src/app/v1/page.tsx` — Header + Feed + AlgorithmPanelPortal
- `src/app/v1/_components/sidebar.tsx` — X logo SVG, 3 nav items (Home/Explore/Algorithm), usePathname active state
- `src/app/v1/_components/header.tsx` — Sticky frosted glass, "For You" title
- `src/app/v1/_components/feed.tsx` — Initial fetch, skeletons, TweetCard, IntersectionObserver infinite scroll, SSE, dirty banner
- `src/app/v1/_components/tweet-card.tsx` — Avatar, badges, engagement bar (reply/repost/like/views), Collapsible score breakdown
- `src/app/v1/_components/algorithm-panel.tsx` — Portal into #v1-algorithm-panel, 4 main sliders + 6 advanced engagement sliders, PUT /api/weights
- `src/app/v1/profile/[username]/page.tsx` — Server component, Supabase queries, avatar/bio/follower counts/tweet list
- `src/app/v1/profile/[username]/follow-button.tsx` — Optimistic follow/unfollow with hover "Unfollow" state

### TypeScript Result
- `bunx tsc --noEmit` → 0 errors

### Key Patterns Confirmed
1. Slider `onValueChange` type: `(val: number | readonly number[]) => void` — `Array.isArray(val) ? val[0] : val`
2. CollapsibleTrigger from base-ui: pass `className` directly, no `asChild`
3. Portal target: `useEffect(() => setEl(document.getElementById('v1-algorithm-panel')), [])` — return null until mounted
4. SSE: `es.addEventListener('feed', (_e: Event) => {...})` — event cast if data needed
5. Profile params: `const { username } = await params` (Promise in Next.js 16)
6. Cross-component: `window.dispatchEvent(new Event('v1:weights-saved'))` + `window.addEventListener` in Feed

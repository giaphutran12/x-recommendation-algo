# AGENTS.md — X Recommendation Algorithm Project

## Tech Stack (Verified March 9, 2026)

| Technology | Version | Notes |
|---|---|---|
| Next.js | **16.1** | Turbopack default, `fetch()` NOT cached by default, `useActionState` replaces `useFormState` |
| React | **19.2** | `use()` hook stable, Server Components default |
| Tailwind CSS | **v4** | CSS-first config (`@import "tailwindcss"`, `@theme {}` in CSS, NO `tailwind.config.js`), `@tailwindcss/postcss` plugin, no autoprefixer needed |
| Vitest | **v4.0.17** | `workspace` deprecated → use `projects`, annotation API, scoped fixtures |
| Supabase JS | **v2.98.0** | Still v2, no v3 yet. Use `@supabase/ssr` for Next.js (`createBrowserClient`, `createServerClient`) |
| Bun | **v1.3.10** | Package manager + test runner. Works with Next.js 16 |
| Playwright | **v1.50+** | E2E testing for UI verification |

## Seed Script Strategy

- **Tweet generation**: Via OpenCode subagents (`task()` calls) — $0 cost (user on Claude Max 20x)
- **Embeddings**: Gemini `embedding-001` — $0.15/1M tokens (free tier, ~$0.38 for 50K tweets)
- **No LLM API SDK needed** for tweet generation — tweets are pre-generated as JSON files

## Nia Indexed Sources

### Repositories
- `xai-org/x-algorithm` — X's open-sourced recommendation algorithm (Rust + Python/JAX)
- `supabase/supabase-js` — Supabase JS client (npm package pre-indexed, v2.98.0)

### Documentation (subscribed, searchable via `nia_search`)
- Supabase JS Reference: `a1b1074e-f8ab-4d66-bf15-5372961fef61`
- Supabase Next.js Quickstart: `d1621611-c1b8-4295-aa52-dc2bf3d989b5`
- Next.js Docs: `18c84271-ce76-45be-95ca-1593db26a367`
- Tailwind CSS Docs: `44cfca78-7d11-43ee-b6ed-06b74e1ba880`
- Vitest Docs: `b57b5afe-1a4d-4986-ae85-a089b1917b8b`
- Google ML Recommendation Overview: `c5e8a588-07e4-4c85-9172-979ef2b62770`
- DeepWiki x-algorithm Intro: `fe18aa7c-065b-4b1f-8930-cd2df64e3b91`
- LLM API Pricing March 2026: `c3b0f6c1-1c39-4ba2-b297-acd9ccfa038e`

### npm Packages (pre-indexed, use `nia_package_search_hybrid`)
- `@supabase/supabase-js` (registry: npm)

## Key Architecture Decisions
- **NOT forking X's code** — reimplementing in TypeScript, inspired by their architecture
- **Two-Tower neural network for engagement prediction** — trained in PyTorch, exported to ONNX, inference in TypeScript via onnxruntime-node
- **Text embeddings for OON retrieval** — Gemini `embedding-001` (1536-dim via Matryoshka) + pgvector cosine similarity
- **Heuristic scoring for everything else** — weighted scorer, author diversity, OON penalty remain formula-based
- **Single-user demo app** — no auth, no multi-user
- **Candidate isolation** — score each tweet independently against user context
- **Pipeline pattern**: Retrieve → Hydrate → Filter → Score → Select (mirrors X's `candidate-pipeline` Rust traits)

## Tailwind v4 Gotchas
- `@import "tailwindcss"` NOT `@tailwind base/components/utilities`
- Theme in CSS via `@theme { --color-brand: #3b82f6; }` NOT `tailwind.config.js`
- PostCSS: `@tailwindcss/postcss` NOT `tailwindcss`
- No autoprefixer needed
- Border default changed to `currentColor` (was `gray-200`)
- Ring width default `1px` (was `3px`)

## Research Tool Priority Chain
When researching ANY topic (external docs, model comparisons, best practices, library usage):
1. **Nia FIRST** — use Nia search aggressively for up-to-date framework docs, API docs, latest standards, library versions, best practices. The developer pays for unlimited Nia access — use it instead of hallucinating.
2. **Exa web search SECOND** — if Nia fails (timeout, rate limit, error)
3. **Context7 / Webfetch LAST** — only if both Nia and Exa fail

## Background Task Handling
- ALWAYS use `run_in_background=true` for subagent tasks so the orchestrator remains available for user questions
- NEVER use `block=true` when calling `background_output` — always `block=false`
- Wait for system `[BACKGROUND TASK COMPLETED]` notifications before collecting results
- When the user sends a message while tasks are running, respond to the user FIRST, then collect results
## Code Standards
- Always run linting/type-checking after code changes when available
- Never commit secrets, API keys, or credentials
- NEVER read .env files — ask user to provide the env var names when needed
- Prefer editing existing files over creating new ones
- Never force push to main/master
- Never skip pre-commit hooks (--no-verify)
- Write concise commit messages that explain WHY, not WHAT
- Only commit when explicitly asked

## Debug-First Development
Always include server-side logging when building new features. Don't wait for bugs to add observability.

**Server-Side:** Add `console.log` with a `[TAG]` prefix (e.g., `[AML]`, `[SYNC]`) for every new feature. Log key decision points, external API calls, database writes, error paths, and timing for Supabase/Gemini calls. These logs are visible in Vercel/deployment logs.

**Client-Side:** Do NOT add verbose console.log to production components. Use `toast.error()` for user-facing errors. For development, add temporary `[DEBUG]` logs and remove before committing.

**Lifecycle:** Build WITH server-side logging from the start. Add temporary client `[DEBUG]` logs during development, remove them when verified. Keep server-side logs permanently — they cost nothing and save hours during incidents.

## shadcn/ui — Mandatory Component Rule

**If a component exists in shadcn/ui, you MUST use it. Do NOT write custom components that duplicate shadcn functionality.**

Only write a custom component when NOTHING in the entire shadcn library fits the use case.

All shadcn components are installed via `bunx shadcn@latest add --all` and live in `src/components/ui/`.

### Key shadcn Components (use these FIRST)
- **Button** (`@/components/ui/button`) — all buttons, all variants (ghost, outline, destructive, etc.)
- **Card** (`@/components/ui/card`) — Card, CardHeader, CardTitle, CardContent, CardFooter
- **Badge** (`@/components/ui/badge`) — status pills, tags, labels
- **Skeleton** (`@/components/ui/skeleton`) — loading placeholders
- **Slider** (`@/components/ui/slider`) — range inputs (uses @base-ui, value is array: `value={[n]}`, callback: `onValueChange`)
- **Collapsible** (`@/components/ui/collapsible`) — expandable sections (Collapsible, CollapsibleTrigger, CollapsibleContent)
- **Avatar** (`@/components/ui/avatar`) — user avatars (Avatar, AvatarImage, AvatarFallback)
- **Separator** (`@/components/ui/separator`) — dividers (replaces `border-b` divs)
- **Progress** (`@/components/ui/progress`) — progress bars
- **Tooltip** (`@/components/ui/tooltip`) — hover tooltips (needs TooltipProvider in layout)
- **Spinner** (`@/components/ui/spinner`) — loading spinners

### Icons
- Use `lucide-react` for ALL icons — it's installed with shadcn
- Do NOT write inline SVG icons if a lucide icon exists
- Only use inline SVG for brand logos (X/Twitter logo) that lucide doesn't have

### Utility
- Use `cn()` from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)

### shadcn + Tailwind v4 Setup
- `@import "shadcn/tailwind.css"` in globals.css (after tailwindcss and tw-animate-css)
- `@theme inline {}` block maps shadcn CSS variables to Tailwind color tokens
- Custom X theme colors use `--color-x-*` namespace to avoid collisions with shadcn's `--color-*`
- No `tailwind.config.js` — everything is CSS-first
- `components.json` has `"tailwind.config": ""` (blank for v4)

## Next.js 16 Gotchas
- Turbopack is default — no `--turbopack` flag needed
- `fetch()` NOT cached by default (changed from 14)
- `experimental.turbo` renamed to `turbopack` in config
- `useFormState` → `useActionState` (React 19)
- `serverComponentsExternalPackages` → `serverExternalPackages`

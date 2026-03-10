# Decisions — UI Versions Plan

## [2026-03-10] Architecture
- V0 uses Next.js route group `(v0)` to keep `/` URL
- V1-V5 use regular route folders `/v1`, `/v2`, etc.
- Each version has its own `layout.tsx` with 3-column layout
- Root layout stripped to html/body/font/providers/VersionSwitcher only
- V0 components stay in `src/components/` — V0 layout imports them
- V1-V5 components go in `src/app/v{N}/_components/` (Next.js private folder)

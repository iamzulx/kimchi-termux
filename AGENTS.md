# Agent Guidelines for Kimchi-Termux

You are editing the kimchi-termux fork — Kimchi Coding Agent rebuilt for Termux/Android.

## Environment
- **Package manager**: pnpm (NEVER use npm/yarn)
- **Runtime**: Node.js 22+ (NOT Bun — Bun binary doesn't run on Termux/Bionic)
- **Build**: `node scripts/build-bundle.mjs` via esbuild
- **Test runner**: vitest (`pnpm run test`)
- **Linter**: biome (`pnpm run lint`, `pnpm run lint:fix`)
- **Type check**: TypeScript (`pnpm run typecheck`)

## Termux-specific Constraints
- **No Bun binary** — Termux uses Bionic libc, not glibc. All Bun-specific code must have Node.js fallbacks.
- **No `.md` text imports** — use pre-built `.js` string modules in `bodies-gen/`
- **No native clipboard** — clipboard image support disabled on Termux (no display server)
- **No node-pty** — SSH/teleport unavailable
- **No Playwright** — browser fetch falls back to native fetch
- **`bun:sqlite` unavailable** — use fallback chain: bun:sqlite → node:sqlite → better-sqlite3

## Upstream Patches
All Termux-specific changes are documented in README.md "Patches" section.
When syncing with upstream, re-apply these patches after merge.

## Hard Constraints (inherited from upstream)
- **NEVER modify `patches/` files directly** — patches apply at install
- **NEVER touch `src/core/export-html/` HTML templates** — bundled JS is auto-generated
- **Test files**: Co-locate as `*.test.ts` alongside source

## Development Patterns
- **Auto-formatting**: `lint:fix` runs automatically after file edits
- **Pre-commit**: `.husky/pre-commit` runs `pnpm run lint`

## Build

```bash
pnpm install                     # install dependencies
node scripts/build-bundle.mjs    # build Termux bundle → dist/kimchi-bundle.mjs
```

The bundle (28MB) is the deliverable. It runs on any Node.js 22+ installation without Bun.

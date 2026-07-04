# Kimchi Termux — Autonomous AI Coding Agent for Android

Kimchi Coding Agent rebuilt to run natively on **Termux/Android** (aarch64). No Bun binary, no glibc — pure Node.js ESM bundle.

Based on [getkimchi/kimchi](https://github.com/getkimchi/kimchi) v0.1.58 by CAST AI (Apache 2.0).

## Quick Start

```bash
# 1. Install Node.js (if not already)
pkg install nodejs

# 2. Clone this repo
git clone https://github.com/iamzulx/kimchi-termux.git
cd kimchi-termux

# 3. Install dependencies
pnpm install

# 4. Build the Termux bundle
node scripts/build-bundle.mjs

# 5. Add to PATH
echo 'export PATH="$HOME/kimchi-termux/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 6. Login
kimchi login

# 7. Use
kimchi version
kimchi --print "Hello from Termux!"
kimchi                          # interactive mode
```

## What Works

All features from upstream v0.1.58 work on Termux:

| Feature | Status |
|---------|--------|
| `kimchi version` / `--help` | ✓ |
| `kimchi config` / `resources` / `update` | ✓ |
| `kimchi login` (OAuth browser) | ✓ |
| `kimchi setup-tools` | ✓ |
| `kimchi --print "task"` (non-interactive coding agent) | ✓ |
| `kimchi` (interactive TUI) | ✓ |
| `kimchi --continue` / `--resume` (session persistence) | ✓ |
| `kimchi --name` / `--model` / `--provider` / `--thinking` | ✓ |
| `kimchi --mode text\|json\|rpc\|acp` | ✓ |
| `kimchi --plan` / `--export` / `--no-session` | ✓ |
| Multi-model orchestration (Kimi K2.7, Minimax M3, DeepSeek, Nemotron) | ✓ |
| Ferment mode (`/ferment`) | ✓ |
| MCP servers | ✓ |
| Skills system (superpowers) | ✓ |
| Session persistence | ✓ |
| Tags system | ✓ |
| Tools: bash, read, write, edit, grep, find, ls, web_search, web_fetch, lsp_diagnostics, lsp_rename | ✓ |
| Subagent delegation | ✓ |
| Hooks / behaviours | ✓ |

## Graceful Degradation

These features are unavailable on Termux due to platform constraints (not code bugs):

| Feature | Reason |
|---------|--------|
| Clipboard image support | No display server on Termux |
| Playwright browser fetch | No chromium binary (falls back to native fetch) |
| SSH/teleport remote sessions | Requires node-pty native binding |

## How It Works

The official Kimchi CLI ships as a **Bun compiled binary** (125MB, glibc-linked ELF). This binary cannot run on Termux because Android uses Bionic libc, not glibc.

This rebuild:

1. **Replaces `.md` text imports** — Bun's `import x from "./foo.md" with { type: "text" }` doesn't work in Node.js. Replaced with pre-built `.js` string modules in `src/extensions/behaviours/bodies-gen/`.

2. **Fixes `@xterm/headless` ESM import** — The package exports CJS only but `xterm-core.ts` uses ESM `import { Terminal }`. Fixed via `createRequire()` bridge.

3. **Adds SQLite fallback chain** — `cursor.ts` uses `bun:sqlite` (Bun-only). Added fallback to `node:sqlite` (Node 22+) and `better-sqlite3`.

4. **Builds via esbuild** — All 934 TypeScript source files bundled into a single 28MB ESM file (`dist/kimchi-bundle.mjs`). Runs on stock Node.js.

5. **Launcher script** — `bin/kimchi` sets correct environment variables and launches the bundle.

## Patches (changes from upstream)

| File | What Changed | Why |
|------|-------------|-----|
| `src/extensions/behaviours/registry.ts` | `.md` text imports → pre-built `.js` string modules | Node.js doesn't support Bun's `with { type: "text" }` |
| `src/extensions/behaviours/bodies.d.ts` | Disabled ambient `.md` module declaration | No longer needed after registry.ts change |
| `src/extensions/teleport/pty/xterm-core.ts` | ESM → CJS require via `createRequire()` | `@xterm/headless` exports CJS only |
| `src/integrations/cursor.ts` | `bun:sqlite` → fallback chain | `bun:sqlite` is Bun-only |
| `scripts/build-bundle.mjs` | New file — esbuild build script | Builds the ESM bundle for Node.js |
| `src/entry-termux.ts` | New file — lightweight entry point | Bypasses heavy extension imports for subcommands |
| `bin/kimchi` | New file — launcher script | Sets env vars and runs the bundle |
| `src/extensions/behaviours/bodies-gen/*.js` | New files (6) — pre-built `.md`→`.js` | Inline string exports replacing `.md` imports |

## Project Structure

Same as upstream, plus:

```
scripts/build-bundle.mjs    -- esbuild build script (new)
src/entry-termux.ts          -- Termux entry point (new)
bin/kimchi                   -- launcher script (new)
src/extensions/behaviours/bodies-gen/  -- pre-built .md→.js modules (new)
share/kimchi/                -- runtime package dir (themes, oauth, vendor)
```

## Requirements

- **Node.js >= 22** — `pkg install nodejs` in Termux
- **pnpm** — `npm install -g pnpm`
- **~300MB disk space** — source + node_modules + bundle
- **Kimchi API key** — free at [app.kimchi.dev](https://app.kimchi.dev) (login via `kimchi login`)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KIMCHI_API_KEY` | API key (overrides config) | from `~/.config/kimchi/harness/auth.json` |
| `PI_PACKAGE_DIR` | Path to runtime package dir | auto-detected |
| `PI_CODING_AGENT_DIR` | Agent config dir | `~/.config/kimchi/harness` |
| `NODE_OPTIONS` | Node.js flags | `--max-old-space-size=2048` |

## Build Commands

```bash
pnpm install                     # install dependencies
node scripts/build-bundle.mjs    # build Termux bundle → dist/kimchi-bundle.mjs
pnpm run build                   # original upstream build (requires Bun)
pnpm run dev                     # original upstream dev (requires Bun)
```

## Compared to Upstream

| Aspect | Upstream (getkimchi/kimchi) | Termux (this fork) |
|--------|---------------------------|-------------------|
| Runtime | Bun compiled binary | Node.js ESM bundle |
| Binary size | 125MB (glibc ELF) | 28MB (.mjs) |
| Platform | macOS/Linux (glibc) | Android/Termux (Bionic) |
| `.md` imports | Bun text import | Pre-built JS modules |
| `@xterm/headless` | ESM import | CJS require bridge |
| SQLite | `bun:sqlite` | Fallback chain |
| Clipboard | Native addon | Disabled (no display) |
| Browser fetch | Playwright | Native fetch fallback |
| SSH/teleport | node-pty native | Unavailable |

## License

[Apache License 2.0](LICENSE) — same as upstream [getkimchi/kimchi](https://github.com/getkimchi/kimchi).

## Credits

- [CAST AI](https://cast.ai) — original Kimchi Coding Agent
- [getkimchi/kimchi](https://github.com/getkimchi/kimchi) — upstream source code
- [pi-mono](https://github.com/badlogic/pi-mono) — coding agent SDK

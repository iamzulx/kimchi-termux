# Kimchi Termux — Autonomous AI Coding Agent for Android

Kimchi Coding Agent rebuilt to run natively on **Termux/Android** (aarch64). No Bun binary, no glibc — pure Node.js ESM bundle.

Based on [getkimchi/kimchi](https://github.com/getkimchi/kimchi) v0.1.60 by CAST AI (Apache-2.0).

## Quick Start

```bash
# 1. Install Node.js + Go (if not already)
pkg install nodejs golang

# 2. Clone this repo
git clone https://github.com/iamzulx/kimchi-termux.git
cd kimchi-termux

# 3. Install dependencies
pnpm install

# 4. Build proxy-helper (Go binary)
pnpm run build:proxy-helper

# 5. Build the Termux bundle
node scripts/build-bundle.mjs

# 6. Apply read-tool full-file patch
python3 scripts/patch-bundle-read-limit.py dist/kimchi-bundle.mjs

# 7. Sync to runtime ~/kimchi
mkdir -p ~/kimchi/dist ~/kimchi/bin ~/kimchi/share/kimchi/bin
cp dist/kimchi-bundle.mjs ~/kimchi/dist/
cp bin/kimchi ~/kimchi/bin/kimchi && chmod 700 ~/kimchi/bin/kimchi
cp dist/share/kimchi/bin/proxy-helper ~/kimchi/share/kimchi/bin/
chmod 700 ~/kimchi/share/kimchi/bin/proxy-helper
cp -r share/kimchi/* ~/kimchi/share/kimchi/

# 8. Verify
bash scripts/verify_termux_fixes.sh
python3 scripts/verify_security_hardening.py

# 9. Login
kimchi login

# 10. Use
kimchi version
kimchi --print "Hello from Termux!"
kimchi                          # interactive mode
```

## What Works

All features from upstream v0.1.60 work on Termux:

| Feature | Status |
|---------|--------|
| `kimchi version` / `--help` | ✓ |
| `kimchi config` / `resources` | ✓ |
| `kimchi login` (OAuth browser) | ✓ |
| `kimchi setup-tools` | ✓ |
| `kimchi --print "task"` (non-interactive coding agent) | ✓ |
| `kimchi` (interactive TUI) | ✓ |
| `kimchi --continue` / `--resume` (session persistence) | ✓ |
| `kimchi --name` / `--model` / `--provider` / `--thinking` | ✓ |
| `kimchi --mode text\|json\|rpc\|acp` | ✓ |
| `kimchi --plan` / `--export` / `--no-session` | ✓ |
| Multi-model orchestration (Kimi K2.6, Minimax M3, DeepSeek, Nemotron) | ✓ |
| Ferment mode (`/ferment`) | ✓ |
| MCP servers | ✓ |
| Skills system (superpowers) | ✓ |
| Session persistence | ✓ |
| Tags system | ✓ |
| Tools: bash, read, write, edit, grep, find, ls, web_search, web_fetch, lsp_diagnostics, lsp_rename | ✓ |
| Subagent delegation | ✓ |
| Hooks / behaviours | ✓ |
| PII/secrets redaction in session export | ✓ |
| Security-hardened launcher (path traversal, telemetry disabled, secure tmpfile) | ✓ |

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

3. **Adds SQLite fallback chain** — `cursor.ts` uses `bun:sqlite` (Bun-only). Added fallback to `node:sqlite` (Node 22+).

4. **Builds via esbuild** — All 974 TypeScript source files bundled into a single ~28MB ESM file (`dist/kimchi-bundle.mjs`). Runs on stock Node.js. `esbuild` is a direct devDependency — no hardcoded local paths.

5. **Hardened launcher** — `bin/kimchi` validates paths, blocks `kimchi update` (which would replace the bundle with a Bun/glibc binary), sets resource limits, disables telemetry, and detects output stability for clean exit.

6. **PII/secrets redaction** — Session exports redact API keys, bearer tokens, AWS keys, emails, phone numbers, credit cards, IBANs, and SSNs before uploading as gists.

7. **Nudge scheduler** — Periodic engagement nudges for inactive sessions with configurable intervals.

8. **Proxy-helper hardening** — Go binary for SSH tunnel proxy with secure URL validation (`wss://` enforced, loopback exceptions for local testing).

## Patches (changes from upstream)

| File | What Changed | Why |
|------|-------------|-----|
| `src/extensions/behaviours/registry.ts` | `.md` text imports → pre-built `.js` string modules | Node.js doesn't support Bun's `with { type: "text" }` |
| `src/extensions/behaviours/bodies.d.ts` | Disabled ambient `.md` module declaration | No longer needed after registry.ts change |
| `src/extensions/teleport/pty/xterm-core.ts` | ESM → CJS require via `createRequire()` | `@xterm/headless` exports CJS only |
| `src/integrations/cursor.ts` | `bun:sqlite` → fallback chain | `bun:sqlite` is Bun-only |
| `src/commands/update.ts` | Platform detection for `android` → `linux-arm64` | Upstream lacks Android/arm64 mapping |
| `src/extensions/pii-redaction/` | New module (config, index, redactor, tests) | Redact secrets/PII before session export |
| `src/extensions/agents/nudge-scheduler.ts` | New module + tests | Periodic engagement nudges |
| `src/utils/export-post-process.ts` | New post-processing + redaction tests | Apply redaction to exported HTML/JSONL |
| `src/extensions/report-bug.ts` | Enhanced with PII redaction | Redact session transcript before gist upload |
| `src/extensions/report-bug.test.ts` | Use `os.tmpdir()` instead of `/tmp` | Portable across Termux (no `/tmp`) |
| `tools/proxy-helper/cmd/proxy/proxy.go` | Secure URL validation (wss/http loopback) | Prevent insecure websocket/API connections |
| `scripts/build-bundle.mjs` | New file — esbuild build script | Builds the ESM bundle for Node.js |
| `scripts/build-proxy-helper.js` | Patched for `android/arm64` target | Go build for Termux's arm64 architecture |
| `scripts/copy-resources.js` | `vendor/superpowers/skills` optional | Folder may not exist in Termux-only builds |
| `scripts/patch-bundle-read-limit.py` | New — post-build read tool patch | Forces full-file read (2000 lines) instead of limit=100 |
| `scripts/verify_termux_fixes.sh` | New — Termux verification script | End-to-end verify: launcher, security, proxy-helper, runtime |
| `scripts/verify_security_hardening.py` | New — security verification | 11-point security hardening checklist |
| `src/entry.ts` | Entry sets `PI_PACKAGE_DIR` before pi-mono imports | Same as upstream; built via esbuild |
| `bin/kimchi` | New — hardened launcher script | Path validation, telemetry disabled, update blocked, signal forwarding |
| `src/extensions/behaviours/bodies-gen/*.js` | New files (6) — pre-built `.md`→`.js` | Inline string exports replacing `.md` imports |
| `.github/workflows/termux-ci.yml` | New — Termux-only CI | Targeted tests + build + verify on every push/PR |

## Security Hardening

The launcher (`bin/kimchi`) implements defense-in-depth:

- **Telemetry disabled** — `KIMCHI_TELEMETRY_ENABLED=0` + `KIMCHI_DISABLE_BUILTIN_PROVIDERS=1`
- **Path traversal blocked** — `KIMCHI_DIR` validated against `..` components
- **Self-update blocked** — `kimchi update` exits 1 (official update would break Termux runtime)
- **Resource limits** — `ulimit -f` (file size) only; NO `ulimit -v` (breaks V8 zone allocation on Termux)
- **Signal forwarding** — cleanup trap kills only processes matching `kimchi-bundle.mjs`
- **PID validation** — `/proc/$pid/cmdline` verified before kill
- **Secure tmpfile** — `mktemp -t kimchi.XXXXXX` + `chmod 600`
- **Environment expansion** — `$NINEROUTER_API_KEY` resolved from sidecar file, not inline

Run `python3 scripts/verify_security_hardening.py` for a full 11-point verification.

## CI

Single workflow: `.github/workflows/termux-ci.yml`

| Step | What |
|------|------|
| Typecheck | `tsc --noEmit` (heap 2048MB) |
| Build proxy-helper | Go compile for `android/arm64` |
| Targeted tests | 101 tests across 6 files (PII, update, agents, redaction) |
| Build bundle | `node scripts/build-bundle.mjs` |
| Read patch | `python3 scripts/patch-bundle-read-limit.py` |
| Verify markers | grep for Termux-specific strings in bundle + launcher |

All upstream official/community workflows (ACP E2E, TUI E2E, canary, release, stale, welcome, require-linked-issue, auto-label) have been removed — they are not relevant to this Termux-only fork.

## Project Structure

Same as upstream, plus:

```
scripts/build-bundle.mjs           -- esbuild build script
scripts/build-proxy-helper.js      -- Go proxy-helper builder (android/arm64)
scripts/copy-resources.js          -- resource copier (superpowers optional)
scripts/patch-bundle-read-limit.py -- post-build read tool patch
scripts/verify_termux_fixes.sh     -- Termux verification
scripts/verify_security_hardening.py -- security verification
src/entry.ts                        -- entry (PI_PACKAGE_DIR before pi-mono)
bin/kimchi                          -- hardened launcher script
src/extensions/behaviours/bodies-gen/ -- pre-built .md→.js modules
src/extensions/pii-redaction/      -- PII/secrets redaction module
src/extensions/agents/nudge-scheduler.ts -- engagement nudge scheduler
src/utils/export-post-process.ts   -- export redaction post-processing
share/kimchi/                      -- runtime package dir (themes, oauth, vendor)
tools/proxy-helper/cmd/proxy/proxy.go -- SSH tunnel proxy (Go)
```

## Requirements

- **Node.js >= 22** — `pkg install nodejs` in Termux
- **Go >= 1.26** — `pkg install golang` (for proxy-helper build)
- **pnpm** — `npm install -g pnpm`
- **esbuild** — installed as devDependency (no local path dependencies)
- **~300MB disk space** — source + node_modules + bundle
- **Kimchi API key** — free at [app.kimchi.dev](https://app.kimchi.dev) (login via `kimchi login`)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KIMCHI_API_KEY` | API key (overrides config) | from `~/.config/kimchi/harness/auth.json` |
| `KIMCHI_DIR` | Base install dir | `$HOME/kimchi` |
| `PI_PACKAGE_DIR` | Path to runtime package dir | `$KIMCHI_DIR/share/kimchi` |
| `PI_CODING_AGENT_DIR` | Agent config dir | `~/.config/kimchi/harness` |
| `NINEROUTER_API_KEY` | 9router API key | from `~/.config/kimchi/9router_api_key` |
| `KIMCHI_TELEMETRY_ENABLED` | Telemetry toggle | `0` (disabled in launcher) |
| `KIMCHI_DISABLE_BUILTIN_PROVIDERS` | Disable built-in providers | `1` (in launcher) |
| `NODE_OPTIONS` | Node.js flags | `--max-old-space-size=1024` |

## Build Commands

```bash
pnpm install                           # install dependencies
pnpm run build:proxy-helper            # build Go proxy-helper binary
node scripts/build-bundle.mjs          # build Termux bundle → dist/kimchi-bundle.mjs
python3 scripts/patch-bundle-read-limit.py dist/kimchi-bundle.mjs  # patch read tool
bash scripts/verify_termux_fixes.sh    # verify all Termux fixes
python3 scripts/verify_security_hardening.py  # verify security hardening
```

## 9router (local OpenAI-compatible provider)

1. Save your 9router API key (from `~/.9router/db` / dashboard) to `~/.config/kimchi/9router_api_key` (mode `600`).
2. Launcher exports `NINEROUTER_API_KEY` automatically.
3. `~/.config/kimchi/harness/models.json` should use `"apiKey": "$NINEROUTER_API_KEY"` for provider `9router`.
4. Run: `kimchi --provider 9router --model Youth --print "..."`

**Do not** set `defaultProvider` to `9router` until you have verified `baseUrl` and auth — incomplete provider config can break startup.

## Self-update

`kimchi update` is **disabled** in `bin/kimchi` on Termux. Official updates pull Bun/glibc binaries incompatible with Android/Bionic. To upgrade: pull `iamzulx/kimchi-termux`, re-apply patches, rebuild.

## Compared to Upstream

| Aspect | Upstream (getkimchi/kimchi) | Termux (this fork) |
|--------|---------------------------|-------------------|
| Runtime | Bun compiled binary | Node.js ESM bundle |
| Binary size | 125MB (glibc ELF) | ~28MB (.mjs) |
| Platform | macOS/Linux (glibc) | Android/Termux (Bionic) |
| `.md` imports | Bun text import | Pre-built JS modules |
| `@xterm/headless` | ESM import | CJS require bridge |
| SQLite | `bun:sqlite` | Fallback chain |
| Clipboard | Native addon | Disabled (no display) |
| Browser fetch | Playwright | Native fetch fallback |
| SSH/teleport | node-pty native | Unavailable |
| CI | Official workflows (E2E, canary, release) | Termux-only targeted CI |
| Security | Standard | Hardened launcher (path, telemetry, limits, signals) |
| PII redaction | None | Built-in (secrets, PII in exports) |
| Proxy-helper | Pre-built binaries | Locally compiled Go (android/arm64) |
| Self-update | `kimchi update` | Blocked (would break Termux runtime) |

## Terms of Service

By using Kimchi you agree to the [CAST AI Terms of Service](https://cast.ai/terms/).

## License

[Apache License 2.0](LICENSE) — same as upstream [getkimchi/kimchi](https://github.com/getkimchi/kimchi).

## Credits

- [CAST AI](https://cast.ai) — original Kimchi Coding Agent
- [getkimchi/kimchi](https://github.com/getkimchi/kimchi) — upstream source code
- [pi-mono](https://github.com/badlogic/pi-mono) — coding agent SDK

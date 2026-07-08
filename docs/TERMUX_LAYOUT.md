# Termux Home Layout (Kimchi)

## Directories

| Path | Role |
|------|------|
| `~/kimchi/` | **Runtime install** — `bin/kimchi`, `dist/kimchi-bundle.mjs`, `node_modules`, `share/kimchi` (NO `.git`) |
| `~/kimchi-termux/` | **Git repo** — source, patches, launcher; push to `iamzulx/kimchi-termux` |
| `~/.config/kimchi/` | User config (config.json, models.json, 9router_api_key) |
| `~/.local/share/kimchi/` | XDG data (themes); optional duplicate of share assets |

## Upstream reference (read-only)

- `~/kimchi-official/` — optional read-only clone of `getkimchi/kimchi` for diff/comparison
- Official binaries do **not** run on Termux (glibc vs Bionic).

## Workflow

1. Edit in `~/kimchi-termux/`.
2. Commit + push to `main` (direct push acceptable for this personal Termux fork).
3. Build from source repo:

```bash
cd ~/kimchi-termux
pnpm run build:proxy-helper        # Go binary (android/arm64)
node scripts/build-bundle.mjs      # esbuild bundle
python3 scripts/patch-bundle-read-limit.py dist/kimchi-bundle.mjs
```

4. Sync to runtime:

```bash
cp dist/kimchi-bundle.mjs ~/kimchi/dist/
cp bin/kimchi ~/kimchi/bin/kimchi
cp dist/share/kimchi/bin/proxy-helper ~/kimchi/share/kimchi/bin/
cp -r share/kimchi/* ~/kimchi/share/kimchi/
```

5. Verify:

```bash
bash scripts/verify_termux_fixes.sh         # 8 checks
python3 scripts/verify_security_hardening.py # 11 checks
```

## Do not use

- `kimchi update` — blocked in Termux launcher (official overwrite).
- `pnpm run test` (full suite) — too heavy for Termux RAM (~3.7GB); use CI or targeted tests:

```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec vitest run \
  src/extensions/pii-redaction/redactor.test.ts \
  src/utils/export-post-process.redaction.test.ts \
  src/commands/update.test.ts \
  src/update/github.test.ts \
  src/update/workflow.test.ts \
  src/extensions/agents/nudge-scheduler.test.ts
```

## Config files

| File | Purpose |
|------|---------|
| `~/.config/kimchi/config.json` | API key, telemetry, skill paths, device ID |
| `~/.config/kimchi/harness/models.json` | Provider/model config (use `$NINEROUTER_API_KEY` env ref) |
| `~/.config/kimchi/9router_api_key` | 9router key file (mode 600, single line, no newline) |

`~/kimchi/` is **runtime only** (no `.git`). Canonical git: **kimchi-termux** only.

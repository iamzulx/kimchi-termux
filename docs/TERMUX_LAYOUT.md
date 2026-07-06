# Termux home layout (Kimchi)

## Keep these

| Path | Role |
|------|------|
| `~/kimchi/` | **Runtime install** — `bin/kimchi`, `dist/kimchi-bundle.mjs`, `node_modules`, `share/kimchi` |
| `~/kimchi-termux/` | **Git repo** — source, patches, launcher; push to `iamzulx/kimchi-termux` |
| `~/.config/kimchi/` | User config (models, auth, 9router key) |
| `~/.local/share/kimchi/` | XDG data (themes); optional duplicate of share assets |

## Official upstream (not on device)

- https://github.com/getkimchi/kimchi — releases v0.1.x; binaries do **not** run on Termux.

## Workflow

1. Edit in `~/kimchi-termux/`, commit, push.
2. Build: `cd ~/kimchi-termux && node scripts/build-bundle.mjs` (or build from `~/kimchi` if `node_modules` lives there).
3. Deploy: copy `dist/kimchi-bundle.mjs` and `bin/kimchi` → `~/kimchi/`.
4. Post-build: `python3 scripts/patch-bundle-read-limit.py ~/kimchi/dist/kimchi-bundle.mjs`
5. Verify: `bash scripts/verify_termux_fixes.sh`

## Do not use

- `kimchi update` — blocked in Termux launcher (official overwrite).

## Removed clutter (2026-07-07)

- `~/test-kimchi/` — unrelated Rust experiment
- `~/.kimchi/` — unrelated Rust/docs tree

`~/kimchi/` is a **runtime tree only** (no git). Canonical git: **kimchi-termux** only.
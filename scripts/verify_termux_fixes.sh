#!/usr/bin/env bash
# Post-fix verification for Kimchi Termux (run after audit fixes)
set -euo pipefail
HOME="${HOME:-/data/data/com.termux/files/home}"
FAIL=0
ok() { echo "  ✓ $1"; }
bad() { echo "  ✗ $1"; FAIL=1; }

echo "=== 1. Launcher syntax ==="
bash -n "$HOME/kimchi/bin/kimchi" && ok "bash -n" || bad "bash -n"

echo "=== 2. Block update ==="
OUT=$(kimchi update 2>&1 || true)
if echo "$OUT" | grep -q "disabled on this Termux"; then ok "update blocked"; else bad "update not blocked: $OUT"; fi
test "$(kimchi update >/dev/null 2>&1; echo $?)" = "1" && ok "update exit 1" || bad "update exit code"

echo "=== 3. Security script ==="
python3 "$HOME/kimchi-termux/scripts/verify_security_hardening.py" | tail -3

echo "=== 4. 9router env (no plaintext in models.json) ==="
grep -q '\$NINEROUTER_API_KEY' "$HOME/.config/kimchi/harness/models.json" && ok "models.json uses env" || bad "models.json key"
test -f "$HOME/.config/kimchi/9router_api_key" && ok "key file exists" || bad "key file"
test "$(stat -c %a "$HOME/.config/kimchi/9router_api_key" 2>/dev/null)" = "600" && ok "key file mode 600" || bad "key mode"

echo "=== 5. Read-tool patch in bundle ==="
grep -q "By default, read the FULL file" "$HOME/kimchi/dist/kimchi-bundle.mjs" && ok "read FULL in bundle" || bad "read patch"

echo "=== 6. version + 9router smoke ==="
kimchi version | grep -q "0.1.60" && ok "version"
timeout 90 kimchi --provider 9router --model Youth --print "reply exactly: VERIFY_OK" 2>&1 | grep -q VERIFY_OK && ok "9router Youth" || bad "9router Youth"

echo "=== 7. Runtime vs repo launcher ==="
diff -q "$HOME/kimchi/bin/kimchi" "$HOME/kimchi-termux/bin/kimchi" >/dev/null && ok "launcher synced" || bad "launcher drift"

if [ "$FAIL" -eq 0 ]; then echo ""; echo "ALL VERIFY CHECKS PASSED"; exit 0; else echo ""; echo "SOME CHECKS FAILED"; exit 1; fi
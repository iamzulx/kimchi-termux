# Security Policy — Kimchi Termux Fork

This is the security policy for the **Termux fork** (`iamzulx/kimchi-termux`). For the upstream policy, see [getkimchi/kimchi/SECURITY.md](https://github.com/getkimchi/kimchi/blob/main/SECURITY.md).

## Reporting a Vulnerability

If you discover a vulnerability in this fork specifically (Termux patches, launcher, build scripts):

1. Open a **private** issue at [iamzulx/kimchi-termux](https://github.com/iamzulx/kimchi-termux/issues/new) with `[SECURITY]` prefix.
2. Or email: isekaimoe99@gmail.com

For vulnerabilities in upstream Kimchi, use [GitHub Private Vulnerability Reporting](https://github.com/getkimchi/kimchi/security/advisories/new) on the upstream repo.

## Security Hardening (this fork)

The Termux launcher (`bin/kimchi`) implements the following:

| Control | Implementation |
|---------|---------------|
| **Telemetry disabled** | `KIMCHI_TELEMETRY_ENABLED=0` env var + `KIMCHI_DISABLE_BUILTIN_PROVIDERS=1` |
| **Path traversal blocked** | `KIMCHI_DIR` validated against `..` components at launcher entry |
| **Self-update blocked** | `kimchi update` intercepted → exit 1 (prevents glibc binary overwrite) |
| **Resource limits** | `ulimit -f 1048576` (file size cap); NO `ulimit -v` (breaks V8 zone allocation) |
| **Signal forwarding** | `cleanup()` trap targets only `kimchi-bundle.mjs` processes (PID verified via `/proc`) |
| **Secure tmpfile** | `mktemp -t kimchi.XXXXXX` + `chmod 600` |
| **Credential isolation** | 9router key in sidecar file (`~/.config/kimchi/9router_api_key`, mode 600), not inline in models.json |
| **Environment expansion** | `$NINEROUTER_API_KEY` resolved at runtime, never committed to repo |
| **PII/secrets redaction** | Session exports redact API keys, bearer tokens, AWS keys, emails, phones, CC numbers before gist upload |
| **Dependency pinning** | All `dependencies` use exact versions (no `^`/`~` prefixes) |
| **Credential patterns in .gitignore** | `*.key`, `*.pem`, `*.p12`, `*.pfx`, `auth.json` blocked |

### Verification

Run the automated verification scripts:

```bash
# Termux-specific fixes (8 checks)
bash scripts/verify_termux_fixes.sh

# Security hardening (11 checks)
python3 scripts/verify_security_hardening.py
```

## Known Limitations

- **LLM traffic proxied**: All prompts/responses pass through `llm.kimchi.dev` (Kimchi's infrastructure). This is upstream behavior, not Termux-specific.
- **Playwright fallback**: Without Chromium, web fetch uses native HTTP (no SPA rendering). This is a degradation, not a vulnerability.
- **No clipboard image**: Disabled due to no display server. No attack surface from clipboard image processing.

## Responsible Disclosure

- **No public disclosure before a fix is available.**
- **Act in good faith.** Do not exploit beyond demonstrating the issue.
- **Allow reasonable time for resolution.**

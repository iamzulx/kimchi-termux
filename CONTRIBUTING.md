# Contributing to Kimchi Termux

Thank you for your interest in contributing to Kimchi Termux!

## What This Project Is

This is a fork of [getkimchi/kimchi](https://github.com/getkimchi/kimchi) v0.1.58, rebuilt to run on Termux/Android (aarch64, Bionic libc). The goal is to make the full Kimchi coding agent experience available on Android devices via Termux.

## How to Contribute

1. Fork this repo
2. Create a feature branch (`feat/your-feature` or `fix/your-fix`)
3. Make your changes
4. Test on Termux: `pnpm install && node scripts/build-bundle.mjs && kimchi --print "test"`
5. Open a pull request

## Contribution Areas

- **Platform fixes** — making more upstream features work on Termux
- **Performance** — optimizing bundle size and startup time for mobile
- **Documentation** — improving Termux-specific setup guides
- **Testing** — adding Termux-specific test cases

## Upstream Sync

This fork tracks upstream `getkimchi/kimchi` v0.1.58. When syncing with newer upstream versions:

1. Pull upstream changes
2. Re-apply Termux patches (see README.md "Patches" section)
3. Rebuild: `node scripts/build-bundle.mjs`
4. Test all features: version, --print, interactive, session, ferment, MCP
5. Verify no Bun-specific code regresses without Node.js fallback

## License

Apache License 2.0 — same as upstream. By contributing, you agree that your contributions will be licensed under the same terms.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocket.Chat React Native mobile client. Single-package React Native app (not a monorepo) using pnpm. Supports iOS 16.4+ and Android 7.0+.

Read CONTEXT.md.

## Commands

```bash
corepack enable            # First-time per machine: activates the pinned pnpm version
bundle install             # First-time per worktree: gems vendor into vendor/bundle; pod-install fails with Bundler::GemNotFound without it
pnpm pod-install           # Required before any iOS build
```

Everything else is a standard `package.json` script.

## Code Style

- **Oxfmt**: config in `.oxfmtrc.json` (tabs, single quotes, 130 char width, no trailing commas, arrow parens avoid, bracket same line)
- **Oxlint**: config in `.oxlintrc.json` (import, react, jest, typescript plugins; `eslint-plugin-react-native` and `oxlint-plugin-complexity` loaded via `jsPlugins`)
- **Before committing**: Run `pnpm format-lint` (repo-wide; takes no file list) and `pnpm test <paths>` for modified files. Nothing enforces this locally — CI is the only gate.
- **Reviewing**: apply `CODING_STANDARDS.md`.

## Gotchas

- Local-first data flow: the UI reads from WatermelonDB, sagas sync it with the server.
- Redux + Redux-Saga holds global/server state, but Zustand backs several feature-local stores. Don't assume Redux.

## Continuous Integration

CI triggers, call graph, and manual gates: see `.github/README.md`.

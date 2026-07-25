# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocket.Chat React Native mobile client. Single-package React Native app (not a monorepo) using pnpm. Supports iOS 13.4+ and Android 6.0+.

Read CONTEXT.md.

## Commands

```bash
corepack enable            # First-time per machine: activates the pinned pnpm version
pnpm pod-install           # Required before any iOS build
```

Everything else is a standard `package.json` script.

## Code Style

- **Before committing**: Run `pnpm prettier-lint` and `TZ=UTC pnpm test` for modified files. Nothing enforces this locally — CI is the only gate.

## Gotchas

- Local-first data flow: the UI reads from WatermelonDB, sagas sync it with the server.
- Two state systems coexist: Redux + Redux-Saga for global/server state, and Zustand for feature-local stores (`app/containers/message/stores/`, `MessageComposer/context.tsx`, `MediaCallHeader`, `app/lib/services/voip/`). Don't assume Redux.
- VideoConf (Jitsi, Redux-based) may be replaced or removed in the future.

## Continuous Integration

CI triggers, call graph, and manual gates: see `.github/README.md`.

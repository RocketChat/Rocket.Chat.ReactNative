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

## Architecture

- **State**: Redux + Redux-Saga (`app/actions`, `app/reducers`, `app/sagas`, `app/selectors`, `app/lib/store`).
- **Navigation**: React Navigation 7 — master-detail on tablets vs single stack on phones, switched by `app/lib/hooks/useResponsiveLayout/`.
- **Database**: WatermelonDB, offline-first. Local-first data flow: the UI reads from the DB, sagas sync it with the server.
- **Enterprise** (`app/ee/`) — Omnichannel/livechat features.
- **VideoConf** — server-managed video conferencing (Jitsi), Redux-based. May be replaced or removed in the future.
- **VoIP** (`app/lib/services/voip/`) — WebRTC peer-to-peer audio calls with native CallKit (iOS) and Telecom (Android); uses Zustand stores, not Redux. VoIP and VideoConf are entirely separate features — do not conflate them.

## Continuous Integration

CI triggers, call graph, and manual gates: see `.github/README.md`.

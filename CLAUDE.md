# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocket.Chat React Native mobile client. Single-package React Native app (not a monorepo) using pnpm (version pinned in `package.json#packageManager`, activated via corepack). Supports iOS 13.4+ and Android 6.0+.

- React 19.1, React Native 0.81, Expo 54
- TypeScript with strict mode, baseUrl set to `app/` (imports resolve from there)
- Node: engines `>=18`, volta pins 24.13.1
- Read UBIQUITOUS_LANGUAGE.md

## Commands

```bash
# First-time setup (per machine)
corepack enable            # Activates the pnpm version pinned in package.json

# Install & setup
pnpm install               # Install dependencies (postinstall runs patch-package)
pnpm pod-install           # Install iOS CocoaPods (required before iOS builds)

# Run
pnpm start                 # Start Metro bundler
pnpm ios                   # Build and run on iOS
pnpm android               # Build and run on Android

# Test
TZ=UTC pnpm test           # Run Jest unit tests (TZ=UTC is set in script)
pnpm test --testPathPattern='path/to/test'  # Run a single test file
pnpm test-update           # Update snapshots

# Lint & format
pnpm lint                  # ESLint + TypeScript compiler check
pnpm prettier-lint         # Prettier auto-fix + lint

# Storybook
pnpm storybook:start       # Start Metro with Storybook UI
pnpm storybook-generate    # Generate story snapshots
```

## Worktree contract

When using worktrees (`wt`), the post-start hook runs `pnpm install` only. `wt step copy-ignored` is opt-in and only used when the worktree will perform a native build (iOS/Android/Pods/Gradle/Bundler caches).

## Code Style

- **Prettier**: tabs, single quotes, 130 char width, no trailing commas, arrow parens avoid, bracket same line
- **ESLint**: `@rocket.chat/eslint-config` base with React, React Native, TypeScript, Jest plugins
- **Before committing**: Run `pnpm prettier-lint` and `TZ=UTC pnpm test` for modified files
- Pre-commit hooks enforce these checks

## Architecture

### State Management: Redux + Redux-Saga

- **Actions** (`app/actions/`) — plain action creators
- **Reducers** (`app/reducers/`) — state shape (app, login, connect, rooms, encryption, etc.)
- **Sagas** (`app/sagas/`) — side effects (init, login, rooms, messages, encryption, deepLinking, videoConf)
- **Selectors** (`app/selectors/`) — memoized with reselect
- **Store** (`app/lib/store/`) — configures middleware (saga, app state, internet state)

### Navigation: React Navigation 7

- **Stacks** (`app/stacks/`) — InsideStack (authenticated), OutsideStack (login/register), MasterDetailStack (tablets), ShareExtensionStack
- **Root** (`app/AppContainer.tsx`) — switches between auth states
- **Responsive layout** (`app/lib/hooks/useResponsiveLayout/`) — master-detail on tablets vs single stack on phones

### Database: WatermelonDB (offline-first SQLite)

- **Models** (`app/lib/database/model/`) — Message, Room, Subscription, User, Thread, Upload, Server, CustomEmoji, Permission, Role, etc.
- **Schema** (`app/lib/database/schema/`)
- Local-first: UI reads from DB, sagas sync with server

### API Layer

- **SDK** (`app/lib/services/sdk.ts`) — Rocket.Chat JS SDK for WebSocket real-time subscriptions
- **REST** (`app/lib/services/restApi.ts`) — HTTP via fetch
- **Connect** (`app/lib/services/connect.ts`) — server connection management

### Views & Components

- **Views** (`app/views/`) — 70+ screen components
- **Containers** (`app/containers/`) — reusable UI components
- **Theme** (`app/theme.tsx`) — theming context

### Other Key Systems

- **i18n** (`app/i18n/`) — i18n-js with 40+ locales, RTL support
- **Encryption** (`app/lib/encryption/`) — E2E encryption via @rocket.chat/mobile-crypto
- **Enterprise** (`app/ee/`) — Omnichannel/livechat features
- **Definitions** (`app/definitions/`) — shared TypeScript types
- **VideoConf** (`app/sagas/videoConf.ts`, `app/lib/methods/videoConf.ts`) — server-managed video conferencing (Jitsi); uses Redux actions/reducers/sagas. May be replaced or removed in the future.
- **VoIP** (`app/lib/services/voip/`) — new WebRTC peer-to-peer audio calls with native CallKit (iOS) and Telecom (Android) integration; uses Zustand stores, not Redux. VoIP and VideoConf are entirely separate features — do not conflate them.

### Entry Points

- `index.js` — registers app, conditionally loads Storybook
- `app/index.tsx` — Redux provider, theme, navigation, notifications setup
- `app/AppContainer.tsx` — root navigation container

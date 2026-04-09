# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocket.Chat React Native mobile client. Single-package React Native app (not a monorepo) using Yarn 1.22.22 (npm won't work). Supports iOS 13.4+ and Android 6.0+.

- React 19, React Native 0.79, Expo 53
- TypeScript with strict mode, baseUrl set to `app/` (imports resolve from there)
- Min Node: 22.14.0
- UBIQUITOUS_LANGUAGE has domains

## Commands

```bash
# Install & setup
yarn                       # Install dependencies (postinstall runs patch-package)
yarn pod-install           # Install iOS CocoaPods (required before iOS builds)

# Run
yarn start                 # Start Metro bundler
yarn ios                   # Build and run on iOS
yarn android               # Build and run on Android

# Test
TZ=UTC yarn test           # Run Jest unit tests (TZ=UTC is set in script)
yarn test -- --testPathPattern='path/to/test'  # Run a single test file
yarn test-update           # Update snapshots

# Lint & format
yarn lint                  # ESLint + TypeScript compiler check
yarn prettier-lint         # Prettier auto-fix + lint

# Storybook
yarn storybook:start       # Start Metro with Storybook UI
yarn storybook-generate    # Generate story snapshots
```

## Code Style

- **Prettier**: tabs, single quotes, 130 char width, no trailing commas, arrow parens avoid, bracket same line
- **ESLint**: `@rocket.chat/eslint-config` base with React, React Native, TypeScript, Jest plugins
- **Before committing**: Run `yarn prettier-lint` and `TZ=UTC yarn test` for modified files
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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Rocket.Chat mobile app — React Native 0.79 + Expo 53, React 19, TypeScript. Bare workflow (no Expo managed). Targets iOS 13.4+ and Android 6.0+. Talks to Rocket.Chat servers (0.70.0+).

## Commands

Package manager is **yarn** (npm will not work). Node >= 18 required (CONTRIBUTING says 22.14.0).

- `yarn` — install deps (runs `patch-package` postinstall)
- `yarn pod-install` — install iOS CocoaPods (`bundle exec pod install` under the hood)
- `yarn ios` / `yarn android` — run on simulator/device. Android uses `experimentalDebug` variant + `chat.rocket.reactnative.MainActivity`
- `yarn start` — Metro bundler
- `yarn lint` — runs `eslint .` **and** `tsc` (type-check). Both must pass.
- `yarn prettier-lint` — `prettier --write .` then `yarn lint`
- `yarn test` — Jest with `TZ=UTC`. Run a single test: `yarn test path/to/file.test.ts` or `yarn test -t "test name"`
- `yarn test-update` — update Jest snapshots
- `yarn storybook:start` — Metro in Storybook mode (`USE_STORYBOOK=true`); then `yarn ios`/`android` to launch
- `yarn storybook-generate` — regenerate `.rnstorybook` story index after adding/removing `*.stories.tsx`
- `yarn e2e:start` — Metro for Detox e2e (`RUNNING_E2E_TESTS=true`)

E2E tests live in `/e2e` and are excluded from Jest (`testPathIgnorePatterns: ['e2e']`).

## Architecture

### Entry points
- `index.js` — registers the root component with `AppRegistry`. Branches on `USE_STORYBOOK`: when set, mounts `.rnstorybook`; otherwise mounts `app/index.tsx`. On Android, sets up `react-native-callkeep` for VoIP foreground service.
- `app/index.tsx` — `Root` class component. Wires together Redux `Provider`, `ThemeContext`, `ResponsiveLayoutProvider`, gesture handler, keyboard provider, action sheet, and renders `AppContainer`. Owns app-level dimensions/master-detail (tablet) state, theme, deep-linking, push-notification bootstrap, and VoIP/video-conf initial-event handling.
- `app/AppContainer.tsx` — top-level navigation container.

### State management
- **Redux** (`react-redux` v8) is the primary store. Reducers in `app/reducers/`, sagas in `app/sagas/` (`redux-saga` + `typed-redux-saga`), actions in `app/actions/`. Selectors in `app/selectors/`.
- `app/lib/store/` holds the configured store, middlewares (`appStateMiddleware`, `internetStateMiddleware`, `reduxLogger`), and `auxStore.ts` which exposes the store instance to non-React modules via `initStore(store)`.
- **Zustand** is also a dependency and used for some newer slices alongside Redux.
- **WatermelonDB** (`@nozbe/watermelondb`) is the local database for messages/rooms. Database code lives in `app/lib/database/`.

### Navigation
- `@react-navigation/*` v7 (native-stack + drawer). Stacks live in `app/stacks/` (e.g., `InsideStack.tsx`, outside stack, masterDetail stacks). Tablet uses a master-detail layout gated by `MIN_WIDTH_MASTER_DETAIL_LAYOUT` and `isTablet`.

### Feature code layout
- `app/views/` — screen components, one folder/file per screen (e.g., `CallView/`, `RoomView/`, `RoomsListView/`).
- `app/containers/` — reusable cross-screen components (ActionSheet, Toast, Loading, message renderers, etc.).
- `app/lib/` — non-UI app code:
  - `services/` — server API client, voip (`voip/MediaCallEvents`), etc.
  - `methods/` — business logic / data access methods
  - `notifications/` — push + video-conf notification handling
  - `encryption/` — E2E encryption
  - `database/` — WatermelonDB schema/models/operations
  - `hooks/`, `helpers/`, `constants/`, `navigation/`, `native/` (codegen JS specs for native modules → `RocketChatSpecs`)
- `app/ee/` — enterprise-edition-only features
- `app/i18n/` — translations (`yarn organize-translations` to normalize)
- `app/definitions/` — shared TypeScript types
- `app/theme.tsx` + `app/lib/constants/colors` — theming (light/dark/black)

### Native / platform
- `ios/` and `android/` are checked-in native projects (bare workflow). Codegen config in `package.json` → `codegenConfig` generates `RocketChatSpecs` from TS in `app/lib/native`.
- VoIP uses `react-native-webrtc`, `@rocket.chat/media-signaling` (vendored tarball under `packages/`), `react-native-callkeep`, and `react-native-incall-manager`.

### Tests
- Jest with `jest-expo` preset (`./jest.preset.js`). Setup: `jest.setup.js` + `react-native-gesture-handler/jestSetup.js`. `transformIgnorePatterns` whitelists RN/Expo/react-navigation/`@rocket.chat/ui-kit` for transformation.
- Reducers have colocated `*.test.ts` files in `app/reducers/`. Snapshot tests come from Storybook stories (`*.stories.tsx`) generated via `sb-rn-get-stories` into `.rnstorybook`.

## Conventions

- Pre-commit hooks enforce ESLint, Prettier, and tests — do not bypass with `--no-verify`.
- Follow `.github/PULL_REQUEST_TEMPLATE.md` when opening PRs.
- Whitelabel builds: see `yarn android-whitelabel` and the whitelabel docs linked in README.

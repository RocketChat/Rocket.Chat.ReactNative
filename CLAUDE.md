# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install:** `yarn` (postinstall runs patch-package), `yarn pod-install` for iOS
- **Run:** `yarn android`, `yarn ios`
- **Lint:** `yarn lint` — runs ESLint + `tsc` together
- **Test:** `yarn test` — single test: `yarn test --testPathPattern=<path>`
- **Format:** `yarn prettier-lint` — always run before considering code done

## Conventions

- **Branches:** dot-separated — `feat.call-waiting`, `fix.crash-on-login`, `chore.bump-deps`
- **Commits:** conventional with scope — `feat(voip): add call waiting`
- **PRs:** target `develop`
- **TS imports:** use `import type { X }` or `import { type X }`
- **Imports:** `tsconfig.baseUrl` is `app/` — e.g., `import X from 'lib/foo'` resolves to `app/lib/foo`

## Architecture

- Two app targets: **RocketChatRN** (experimental) and **Rocket.Chat** (official)
- Redux + Redux-Saga for state, WatermelonDB for local database
- React Compiler in annotation mode — opt-in per component
- E2E tests: `.mock.ts` files auto-prioritized by Metro (`RUNNING_E2E_TESTS=true`)

## Accessibility (a11y)

### Screen reader
- All interactive elements need `accessibilityLabel` + `accessibilityRole`
- Use `react-native-a11y-order` (`A11y.Order` / `A11y.Index`) when reading order differs from visual order
- Use `AccessibilityInfo.setAccessibilityFocus()` to focus important elements on mount (e.g., incoming call)
- Use `AccessibilityInfo.announceForAccessibility()` for dynamic state changes (errors, call cancelled)
- Use `useIsScreenReaderEnabled` (`app/lib/hooks/useIsScreenReaderEnabled.ts`) to adapt behavior when a screen reader is active — e.g., disabling tap-to-hide gestures
- `accessibilityElementsHidden={true}` on containers that are visually hidden but still mounted

### Font scaling
- Text scales automatically — never set `allowFontScaling={false}` unless layout is provably broken
- `useResponsiveLayout()` provides `fontScale`, `fontScaleLimited` (capped at `FONT_SCALE_LIMIT = 1.3`), `width`, `height`
- Apply `fontScaleLimited` only where large font scales break fixed-size containers — not by default
- Fixed-size touch targets (icon buttons, avatars) do not need to scale

### Landscape / responsive layout
- Always use `useResponsiveLayout()` (not `useWindowDimensions()` directly) to get `width` / `height`
- Derive `isLandscape = width > height` from those values
- `useResponsiveLayout` is the single source of truth for dimensions — avoids conflicts with tablet (Master Detail) layout

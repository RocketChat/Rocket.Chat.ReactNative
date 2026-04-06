# VoIP Accessibility Design

**Date:** 2026-04-06  
**Branch:** feat.voip-lib-new  
**Scope:** Screen reader (VoiceOver/TalkBack), landscape layout, and font scaling for new VoIP screens.

---

## Problem

The new VoIP screens introduced in `feat.voip-lib-new` are missing accessibility support. Key gaps:

- `CallView` has no landscape layout — controls overlap on rotation
- `CallerInfo` tap-to-hide controls is unusable by screen reader users
- `DialpadButton` and `PeerItem` are interactive with no accessible labels or roles
- `CallButtons` container remains focusable when visually hidden

Already well-covered: `IncomingCallNotification`, `CallHeader`, `CallActionButton`, `EndCall`, `Collapse`.

---

## Approach

Prop-by-prop gap fill following existing codebase patterns. One new hook (`useIsScreenReaderEnabled`). No new abstractions beyond that.

---

## Architecture

### New hook — `useIsScreenReaderEnabled`

**File:** `app/lib/hooks/useIsScreenReaderEnabled.ts`

Listens to `AccessibilityInfo.isScreenReaderEnabled()` and the `screenReaderChanged` event. Returns a `boolean` that updates reactively.

```ts
export const useIsScreenReaderEnabled = (): boolean => {
	const [enabled, setEnabled] = useState(false);
	useEffect(() => {
		AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
		const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
		return () => sub.remove();
	}, []);
	return enabled;
};
```

Used by `CallerInfo` to disable tap-to-hide when a screen reader is active.

---

## Components

### CallView — landscape layout

**File:** `app/views/CallView/index.tsx` + `styles.ts`

- Use `useResponsiveLayout()` (already in context) to derive `isLandscape = width > height`. Do **not** call `useWindowDimensions()` directly — `useResponsiveLayout` is the single source of truth for dimensions and avoids conflicts with tablet support.
- In landscape: `contentContainer` switches to `flexDirection: 'row'`. `CallerInfo` takes ~40% width (left), `CallButtons` takes ~60% width (right).
- `isLandscape` is passed as a prop to `CallerInfo` and `CallButtons`.
- Avatar shrinks from 120 → 80 in landscape to prevent overlap.
- Buttons grid retains 3×2 layout with reduced horizontal padding.

### CallerInfo — screen reader fix + label

**File:** `app/views/CallView/components/CallerInfo.tsx`

- Import `useIsScreenReaderEnabled`.
- When screen reader is enabled: `onPress` is `undefined` (controls stay visible, toggling is disabled).
- `useControlsVisible` is modified to always return `true` when screen reader is enabled, so both `CallerInfo` and `CallButtons` derive the correct value automatically.
- Pressable gains `accessibilityLabel={I18n.t('Toggle_call_controls')}` and `accessibilityRole='button'`.

### CallButtons — hide from screen reader when not visible

**File:** `app/views/CallView/components/CallButtons.tsx`

- `Animated.View` gains `accessibilityElementsHidden={!controlsVisible}`.
- Ensures screen reader skips hidden controls (belt-and-suspenders with the `useControlsVisible` fix above).

### DialpadButton — label + role

**File:** `app/views/CallView/components/Dialpad/DialpadButton.tsx`

```tsx
accessibilityLabel={letters ? `${digit} ${letters}` : digit}
accessibilityRole='button'
```

- `fontScaleLimited` from `useResponsiveLayout` applied to digit font size if testing reveals overflow at large scales.

### PeerItem — label + role

**File:** `app/containers/NewMediaCall/PeerItem.tsx`

```tsx
accessibilityLabel={item.label}
accessibilityRole='button'
```

`PeerItemInner` requires no changes — non-interactive, covered by parent label.

---

## Font scaling

All `Text` components in VoIP screens scale automatically (RN default, `allowFontScaling` defaults to `true`). No explicit opt-out.

Fixed-size containers (`actionButton` 64×64, avatar 120px) are touch targets and do not need to scale.

Apply `fontScaleLimited` only where testing reveals actual layout breakage, following the existing `FONT_SCALE_LIMIT = 1.3` pattern in `useResponsiveLayout`.

---

## i18n keys needed

| Key                    | Value (EN)             |
| ---------------------- | ---------------------- |
| `Toggle_call_controls` | `Toggle call controls` |

---

## What is NOT in scope

- `IncomingCallNotification`, `CallHeader`, `CallActionButton`, `EndCall`, `Collapse` — already covered
- A11y ordering (`A11y.Order`) for CallView — buttons already have individual labels; ordering is not needed
- `announceForAccessibility` on call state changes — out of scope for this task

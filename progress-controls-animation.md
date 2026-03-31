# Tap-to-Hide Controls in CallView — Progress

## Vertical Slices

Each slice is independently demoable and builds on the previous one.

| Order | Title                                                       | Type | Blocked by | Status |
| ----- | ----------------------------------------------------------- | ---- | ---------- | ------ |
| 1     | feat: add `controlsVisible` state and actions to call store | AFK  | None       | [x]    |
| 2     | feat: tap CallerInfo to toggle controls visibility          | AFK  | #1         | [x]    |
| 3     | feat: animate CallButtons slide-down + fade on toggle       | AFK  | #2         | [x]    |
| 4     | feat: animate MediaCallHeader slide-up + fade on toggle     | AFK  | #2         | [x]    |
| 5     | feat: auto-show controls on call state changes              | AFK  | #1         | [x]    |
| 6     | chore: update tests and snapshots for controls animation    | AFK  | #2, #3, #4 | [x]    |

---

### Slice 1: feat: add `controlsVisible` state and actions to call store

**User stories:** 1, 2, 8

**What to do:**

- Add `controlsVisible: boolean` (default `true`) to `CallStoreState` in useCallStore
- Add `toggleControlsVisible()` action — flips the boolean
- Add `showControls()` action — sets `controlsVisible: true`
- Add `CONTROLS_ANIMATION_DURATION = 300` constant to CallView styles
- Add convenience selector `useControlsVisible`

**Demo:** Call `toggleControlsVisible()` from store in tests/devtools and verify state flips.

---

### Slice 2: feat: tap CallerInfo to toggle controls visibility

**User stories:** 1, 2, 6, 7

**What to do:**

- Wrap CallerInfo outer `<View>` with `<Pressable onPress={toggleControlsVisible} testID='caller-info-toggle'>`
- Wrap caller name `callerRow` in `<Animated.View>` with fade + slight slide animation driven by `controlsVisible`
- Avatar stays unwrapped — always visible and centered
- Use `useAnimatedStyle` + `withTiming` reading `controlsVisible` directly from store (no useEffect)

**Demo:** Tap the center of CallView — caller name fades out, avatar stays. Tap again — name fades back in.

---

### Slice 3: feat: animate CallButtons slide-down + fade on toggle

**User stories:** 1, 2, 5, 10

**What to do:**

- Replace outer `<View>` in CallButtons with `<Animated.View>`
- Add `useAnimatedStyle` for opacity (1→0) and translateY (0→100) driven by `controlsVisible`
- Set `pointerEvents={controlsVisible ? 'auto' : 'none'}` to block ghost taps

**Demo:** Tap center — buttons slide down and fade out, invisible buttons are not tappable. Tap again — buttons slide back up.

---

### Slice 4: feat: animate MediaCallHeader slide-up + fade on toggle

**User stories:** 1, 2, 5, 11

**What to do:**

- Replace call-active `<View>` in MediaCallHeader with `<Animated.View>`
- Add `useAnimatedStyle` for opacity (1→0) and translateY (0→-100) driven by `controlsVisible`
- Guard: only animate when `focused === true`. When `focused === false` (collapsed header bar), always show.
- Set `pointerEvents={shouldHide ? 'none' : 'auto'}`

**Demo:** Tap center in CallView — header slides up and disappears. Collapse to header bar — header is always visible regardless of `controlsVisible`.

---

### Slice 5: feat: auto-show controls on call state changes

**User stories:** 3, 4, 8, 9

**What to do:**

- In `handleStateChange` (inside `setCall`): add `set({ controlsVisible: true })`
- In `handleTrackStateChange` (inside `setCall`): add `set({ controlsVisible: true })`
- In `toggleFocus`: set `controlsVisible: true` when toggling (always reveal on focus change)
- `reset()` already covers call-end via `initialState` spread

**Demo:** Hide controls → trigger remote hold from another client → controls auto-reveal. Collapse to header → re-expand → controls are visible.

---

### Slice 6: chore: update tests and snapshots for controls animation

**User stories:** All (verification)

**What to do:**

- **Store tests:** `toggleControlsVisible` flips value, `showControls` sets true, auto-show on stateChange/trackStateChange, reset restores true, toggleFocus sets true
- **CallerInfo tests:** pressing `caller-info-toggle` calls `toggleControlsVisible`, snapshot update
- **CallButtons tests:** `pointerEvents='none'` when `controlsVisible=false`, snapshot update
- **MediaCallHeader tests:** `pointerEvents='none'` when `focused=true && controlsVisible=false`, `pointerEvents='auto'` when `focused=false`, snapshot update

**Demo:** `yarn test -- --testPathPattern='CallView|MediaCallHeader|useCallStore'` passes.

---

## Design Decisions Log

| Question                      | Decision                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| What hides?                   | Everything except avatar — header, buttons, caller name/text |
| Auto-hide timer?              | No — explicit tap only                                       |
| Animation style?              | Slide + fade, ~300ms with `withTiming`                       |
| Auto-show on state changes?   | Yes — stateChange + trackStateChange events                  |
| New state or reuse `focused`? | New `controlsVisible` boolean, orthogonal to `focused`       |
| MediaCallHeader location?     | Stays at app root, subscribes to store independently         |
| Tap target?                   | Center CallerInfo area only (not buttons)                    |

## References

- PRD: `prd-controls-animation.md`
- Plan: `.claude/plans/calm-brewing-fox.md`

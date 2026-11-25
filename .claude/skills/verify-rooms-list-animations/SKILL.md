---
name: verify-rooms-list-animations
description: Model-checks the rooms list section toggle animations (useSectionToggleAnimation in app/views/RoomsListView/hooks/useSectionToggleAnimation.ts - onToggle, fadeOut, fadesOnMount, isAnimatingToggle, coverEntering, the UNUSED_TOGGLE_DISARM_MS timeout - useFadeInOnMount and components/FadeInOnMount.tsx, and the views that use them - the Room row in app/views/RoomsListView/index.tsx, the header badge in components/SectionHeader.tsx, the reveal cover in components/SectionRevealFooter.tsx) against every order of section toggles, React commits, server syncs adding rows, fade ends and timers, with reduced motion on or off. Use before merging any change to those files, after a react-native-reanimated upgrade that touches layout animations, or when Room rows stay invisible, rows fade outside a section toggle, the cover hides the list, or animations run with reduced motion on.
---

# Verify rooms list animations

A tla-ts model of the rooms list section toggle. Tapping a section chevron arms a fade; when React commits the new collapsed sections, the section's Room rows and the header unread badge mount or unmount, and the reveal cover remounts. The first exit animation after the tap opens a `TOGGLE_SETTLE_MS` window. A row or badge leaving fades out only inside that window; one mounting fades in from the tap until the window elapses. A server sync can add a Room row at any moment. TLC checks every order of these events within the bounds below.

## Rules it checks

| Rule                         | Plain sentence                                                                                               | Harm when broken                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `everyMountedRowEndsVisible` | Once the animations settle, every mounted Room row and the badge are fully visible, and no cover hides them. | Rows stay invisible after login or after a sync (the Reanimated 4.7 failure: an `entering` opacity 0 finished by a zero-duration `withTiming`). |
| `toggleFadeOnlyInsideToggle` | A fade runs only inside a section toggle: from the tap until its fades settle.                               | New rooms fade in on every sync, or a stale toggle fades an unrelated row.                                                                      |
| `reducedMotionSkipsFades`    | With reduced motion on, no row or badge fades and the reveal cover never shows.                              | Motion for users who turned it off.                                                                                                             |

## Run

From this skill's folder:

```sh
./check.sh
```

It copies the model to a fresh `mktemp -d` and runs `pnpm dlx tla-ts@0.0.10 roomsListAnimations.ts`. At the sync commit it prints `PASS roomsListAnimations rules (247 distinct states found)` in a few seconds. Exit 0 means every rule holds; `FAIL` names the first broken rule.

After editing the model, confirm the rules can still fail:

```sh
./check.sh --mutants
```

Each mutant breaks one piece of the model's mirror of the code and expects its rule (checked alone) to catch it: `CAUGHT`. `MISSED` means a rule went blind or the mutant no longer compiles; `STALE` means the mutated text is gone from the model, so update the mutant.

To draw the chart (states grouped by reduced motion and toggle phase), run `/statechart` on `model/roomsListAnimations.ts`; it picks up `model/roomsListAnimations.view.ts`.

## Reading a failure

Read the path with `/statechart`, then replay it on device: these animations run on the UI thread through Reanimated's layout animation engine, so Jest cannot replay them. Use a simfleet lane, turn on Categories in the rooms list Display menu so sections exist, and record with `evidence-video`. A model `tapToggle` is a tap on `rooms-list-section-<header>`, `syncInsertsRow` is a room created or received while the list is mounted, and reduced motion is the system setting read at app launch (Android: `settings put global transition_animation_scale 0`; iOS: Reduce Motion), so relaunch after changing it.

- The path replays on device: a bug in the code. Fix the code, mirror the fix in the model, rerun.
- A step cannot happen in the code: a modeling error. Fix the model, update the coverage table, rerun with `--mutants`.

## Coverage (sync: `e78d074b23` on `chore/reanimated-4-8-new-layout-engine`)

| Model piece                    | Code                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reducedMotion`                | `useReducedMotion()`, read once per app launch                                                                                                                                                                                                          |
| `isToggling`, `toggleWindow`   | the `isToggling` and `toggleAnimatedAt` shared values; `isAnimatingToggle` opens the window on the first animation after a tap and closes it after `TOGGLE_SETTLE_MS` (`toggleWindowElapses`)                                                           |
| `disarmPending`, `disarmFires` | the `useEffect` timeout that clears `isToggling` `UNUSED_TOGGLE_DISARM_MS` after each `collapsedGroups` change. It cannot fire inside a window the commit opened, since that window is shorter                                                          |
| `tapToggle`                    | `onToggle`: `runOnUISync` resets `toggleAnimatedAt` and sets `isToggling`, then `toggleGroup`                                                                                                                                                           |
| `commitToggle`                 | React committing the new `collapsedGroups`: Room rows of the section and the `SectionHeader` badge (`collapsed ? <FadeInOnMount fadeIn={badgeFadeIn} exiting={badgeExiting}>`) mount or unmount; `SectionRevealFooter` remounts under a new `revealKey` |
| `unmount`, `fades`             | `fadeOut()`, the `exiting` layout animation: `isReducedMotion \|\| !isAnimatingToggle(...)` removes the view at once; otherwise an opacity spring to 0. `isAnimatingToggle` opens the window                                                            |
| `mount`, `fadesOnMount`        | `useFadeInOnMount`: on first render, `fadesOnMount()` (`!isReducedMotion && isInsideToggle(...)`) decides once; a fading view renders at opacity 0 and an effect springs its animated style to 1, otherwise it renders at 1. Mounting opens no window   |
| `cover`                        | `coverEntering`, passed only when `revealKey` is set and reduced motion is off, and active only while `isToggling`: opacity 1 until `withDelay(TOGGLE_SETTLE_MS, …)` drops it to 0 (`coverHides`)                                                       |
| `syncInsertsRow`               | a subscription added by a server sync while the list is mounted (`useSubscriptions`)                                                                                                                                                                    |
| `fadeEnds`                     | an opacity spring finishing                                                                                                                                                                                                                             |

Move the sync commit forward only after reading the covered code at the new commit and confirming the model still describes it (or updating the model and rerunning `./check.sh --mutants`).

## Scope and assumptions

One toggled section, at most two toggles, one sync insert, and any order of the events above.

Assumptions:

- Reanimated ends each animation at its target value. The model checks the app's logic, not the engine; an engine that leaves a view at its initial value is what `everyMountedRowEndsVisible` names as harm, and only a device run shows it.
- Every toggle commit removes a view (the section's rows on collapse, the badge on expand), so a toggle with reduced motion off always opens the window in its commit.
- Row and badge fade-ins use an animated style, not an `entering` layout animation: on Android, Reanimated 4.8's layout animations engine holds an `entering` animation until the JS thread is idle, so rows mounted while the expand renders stayed invisible and then appeared without a fade.

Not covered:

- `SECTION_REFLOW` (`itemLayoutAnimation`): it moves rows, it never changes their opacity.
- The cover's slide distance (`useSectionReveal`) and the cover's 50 ms exit handoff (`coverExiting`).
- Search results, which use the same rows with the same animations.

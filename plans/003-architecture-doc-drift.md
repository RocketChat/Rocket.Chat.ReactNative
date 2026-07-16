# 003 — Fix ARCHITECTURE.md drift (removed FROZEN_KEYS / useFrozenHandlersGuardDev)

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** None (docs only)
- **Planned at:** `59f97b0ac`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. `app/containers/message/docs/ARCHITECTURE.md` is the load-bearing reference for the Message module's three Zustand stores.

Commit `f03920ec9` removed the `FROZEN_KEYS` constant and the `useFrozenHandlersGuardDev` dev guard from `app/containers/message/stores/MessageRoomStore.tsx` (rationale from that commit: RoomView now passes referentially stable handlers, so the migration-time identity-change warning and its FROZEN_KEYS list are dead weight; the capture-once/reactive-tail store design is unchanged). The doc still references both.

Verify current state first (must both return nothing in `app/containers/message/`):

```bash
grep -rn "FROZEN_KEYS\|useFrozenHandlersGuardDev" app/containers/message --include='*.ts' --include='*.tsx'
```

The other guard, `useMessageFieldDev`, **still exists** — its doc paragraph stays.

## Change

Edit `app/containers/message/docs/ARCHITECTURE.md` only. Two stale spots:

1. **Line 37** (MessageRoomStore bullet) currently says:

   > ...the logged user are captured once (see `FROZEN_KEYS`) and never resynced...

   Change the parenthetical: `captured once at provider mount and never resynced`. Rest of the sentence and the reactive-tail description stay untouched.

2. **Lines 44-47** (dev guards section) currently:

   > Two dev-only guards protect this pattern from silent regressions (both no-op in production builds):
   >
   > - `useMessageFieldDev` (MessageStore) warns once ... guarded separately by `Message.memo.test.ts`.
   > - `useFrozenHandlersGuardDev` (MessageRoomStore) warns once if any `FROZEN_KEYS` value's identity changes after mount, since the provider captures those once and never re-syncs them.

   Delete the second bullet entirely. Reword the intro to singular: `A dev-only guard protects this pattern from silent regressions (no-op in production builds):` — keeping the `useMessageFieldDev` bullet exactly as is (or fold it into a single paragraph if the list reads awkwardly with one item; either is fine).

Do not rewrite anything else in the file.

## Scope

- **In scope:** `app/containers/message/docs/ARCHITECTURE.md`.
- **Out of scope:** all source code; `CONTEXT.md`; re-adding any guard.

## Verification / done criteria

1. `grep -n "FROZEN_KEYS\|useFrozenHandlersGuardDev" app/containers/message/docs/ARCHITECTURE.md` → empty.
2. `grep -n "useMessageFieldDev" app/containers/message/docs/ARCHITECTURE.md` → still present.
3. `pnpm lint` → exits 0 (unchanged, docs don't lint, but confirms no accidental source edits).

## Test plan

None — documentation change.

## Maintenance note

When a dev guard or store constant is removed from `app/containers/message/stores/`, this doc must be updated in the same commit.

## Escape hatches

- If the grep in Context shows `FROZEN_KEYS` or `useFrozenHandlersGuardDev` still exist in source (drift since `59f97b0ac`), STOP and report — the doc would then be correct and the plan void.

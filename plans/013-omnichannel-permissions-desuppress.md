# 013 — Make `useOmnichannelPermissions.ts` compile: module-level helpers + honest effect deps

- **Status:** DONE `eb14e7d43`
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (single hook file, target content pre-verified to compile and lint clean)
- **Planned at:** `ea3601101`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` — `'use memo'` functions get compiled, including under jest). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, `TZ=UTC pnpm test`.

**The problem:** `app/views/RoomView/hooks/useOmnichannelPermissions.ts` carries `'use memo'` but the compiler silently skips it because of the `// eslint-disable-next-line react-hooks/exhaustive-deps` at line 78. Same disease as the just-fixed `index.tsx` (commit `ea3601101`): the annotation lies, the hook runs unmemoized.

**Why simple de-suppression fails:** the effect calls `updateOmnichannel`, a plain component-scope function — listing it as a dep makes eslint warn "makes the dependencies change on every render". And the helper `getCanReturnQueue` contains a try/catch, which the compiler cannot yet compile inside an annotated function ("value blocks within a try/catch" limitation). Moving ALL helpers to module scope solves both: module functions are eslint-stable and outside the compiler's reach.

**Dep-stability facts (verified — do not re-derive):**

- `transferLivechatGuestPermission` / `viewCannedResponsesPermission` come from redux `connect` mapStateToProps (`state.permissions[...]` — direct store references), stable identity until a real permissions sync. Adding them as deps refires the effect only on genuine permission changes (a behavior improvement: today a permission change does NOT refetch).
- `room` and `roomStore` are stable references per RoomView instance; `t`/`rid` are route-stable. No per-render refire risk.
- `joined` stays in the deps as a deliberate re-key even though the body doesn't read it — eslint does not flag extra reactive deps (verified).

**The exact target content below was pre-verified**: it compiles under the real plugin with `panicThreshold: 'all_errors'` (output imports `react/compiler-runtime`) and produces zero eslint findings at its real path.

## Change

### 1. `app/views/RoomView/hooks/useOmnichannelPermissions.ts` — replace ENTIRE file content with:

```ts
import { useEffect } from 'react';

import { getRoutingConfig } from '../../../lib/services/restApi';
import { hasPermission } from '../../../lib/methods/helpers';
import { type IRoomViewState } from '../definitions';
import { type RoomStore } from '../stores/RoomStore';

export interface IUseOmnichannelPermissionsParams {
	rid?: string;
	t?: string;
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	joined: boolean;
	transferLivechatGuestPermission?: string[];
	viewCannedResponsesPermission?: string[];
	livechatAllowManualOnHold?: boolean;
	roomStore: RoomStore;
}

const getPermissionFlag = async (permission: string[] | undefined, rid?: string) => {
	const permissions = await hasPermission([permission], rid);
	return permissions[0] as boolean;
};

const getCanReturnQueue = async () => {
	try {
		const { returnQueue } = await getRoutingConfig();
		return returnQueue;
	} catch {
		return false;
	}
};

const getCanPlaceLivechatOnHold = (livechatAllowManualOnHold: boolean | undefined, room: IRoomViewState['room']) =>
	!!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);

export function useOmnichannelPermissions({
	rid,
	t,
	room,
	roomUpdate,
	joined,
	transferLivechatGuestPermission,
	viewCannedResponsesPermission,
	livechatAllowManualOnHold,
	roomStore
}: IUseOmnichannelPermissionsParams): void {
	'use memo';

	// If it's a livechat room
	useEffect(() => {
		if (t !== 'l') {
			return;
		}
		let cancelled = false;
		const updateOmnichannel = async () => {
			const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
				getPermissionFlag(transferLivechatGuestPermission, rid),
				getCanReturnQueue(),
				getPermissionFlag(viewCannedResponsesPermission, rid)
			]);
			if (cancelled) {
				return;
			}
			const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold(livechatAllowManualOnHold, room);
			roomStore.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
		};
		updateOmnichannel();
		return () => {
			cancelled = true;
		};
	}, [
		t,
		rid,
		room,
		roomStore,
		transferLivechatGuestPermission,
		viewCannedResponsesPermission,
		livechatAllowManualOnHold,
		roomUpdate.lastMessage?.token,
		roomUpdate.visitor,
		roomUpdate.status,
		joined
	]);
}
```

Semantics preserved: the `cancelled` closure flag replaces the previous `isCancelled` callback param with identical checked-after-await semantics (the overlap race test relies on this — see Test plan). `getCanForwardGuest`/`getCanViewCannedResponse` collapse into one `getPermissionFlag` since they were identical up to the permission argument.

### 2. `app/views/RoomView/reactCompilerContract.test.ts`

Remove the `'app/views/RoomView/hooks/useOmnichannelPermissions.ts'` entry (with its comment) from `KNOWN_SKIPPED`. Do not touch other entries.

## Scope

- **In scope:** the two files above only.
- **Out of scope — do not touch:** `useOmnichannelPermissions.test.tsx` (must pass UNCHANGED — it's the behavior contract), the other 4 KNOWN_SKIPPED files, `index.tsx`, `babel.config.js`, eslint config.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes (17 clean + ratchet). If it fails naming `useOmnichannelPermissions.ts`, STOP and report the compiler error.
2. `TZ=UTC pnpm test --testPathPattern='useOmnichannelPermissions'` → all 3 tests pass UNCHANGED. A failure here is a REAL regression — STOP and report; do not edit the test.
3. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → exactly `✖ 180 problems (0 errors, 180 warnings)`. Any new warning: STOP, report verbatim.
4. `npx tsc` → exit 0. (Plain `pnpm lint` may fail in a nested worktree — use the split commands.)
5. `TZ=UTC pnpm test` → full suite passes.
6. `git diff --stat` → exactly the 2 in-scope files.

## Test plan

Existing `useOmnichannelPermissions.test.tsx` (3 tests, incl. the plan-009 overlap-race test) is the behavior contract and must pass unmodified. The contract test's ratchet is the compile-level proof. No new tests.

## Maintenance note

Helpers are now module-scope on purpose: component-scope functions in `'use memo'` files can't be listed as effect deps without eslint noise, and try/catch bodies can't be compiled at all. Keep future helpers module-level or inside the effect.

## Escape hatches

- Each done criterion above carries its STOP condition.
- If the current file at your checkout differs from the pre-edit state described (drift from `ea3601101`), STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground.

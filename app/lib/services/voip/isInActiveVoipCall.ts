import { useSyncExternalStore } from 'react';

import { useCallStore } from './useCallStore';
import { callLifecycle } from './CallLifecycle';

/** True when there is an active VoIP call — either a bound call or a native-accepted id pending bind. */
export function isInActiveVoipCall(): boolean {
	const { call } = useCallStore.getState();
	return call != null || callLifecycle.preBindStatus().kind === 'awaitingMediaCall';
}

/**
 * Reactive hook form of {@link isInActiveVoipCall}.
 *
 * Combines two subscriptions:
 *   - useCallStore for `call` field changes (bound MediaCall)
 *   - callLifecycle.emitter for preBindFailed / callEnded events that change preBindStatus
 *     (native accept → awaitingMediaCall → idle transitions)
 *
 * Implemented via useSyncExternalStore per the slice 08 architect review requirement.
 */
export const useIsInActiveVoipCall = (): boolean => {
	const call = useCallStore(state => state.call);

	const isPreBind = useSyncExternalStore(
		subscribe => {
			// Re-render when the Pre-bind FSM transitions:
			//   - preBindChanged: covers ALL FSM transitions including the entry edge
			//     (idle → awaitingMediaCall) so UI gating is reactive immediately on
			//     native accept, not just on exit/cleanup.
			//   - preBindFailed: belt-and-suspenders for the cleanup path (also fires preBindChanged).
			//   - callEnded: belt-and-suspenders for the exit path (also fires preBindChanged via
			//     _transitionToIdle inside end()).
			const unsubPreBindChanged = callLifecycle.emitter.on('preBindChanged', subscribe);
			const unsubPreBindFailed = callLifecycle.emitter.on('preBindFailed', subscribe);
			const unsubCallEnded = callLifecycle.emitter.on('callEnded', subscribe);
			return () => {
				unsubPreBindChanged();
				unsubPreBindFailed();
				unsubCallEnded();
			};
		},
		() => callLifecycle.preBindStatus().kind === 'awaitingMediaCall'
	);

	return call != null || isPreBind;
};

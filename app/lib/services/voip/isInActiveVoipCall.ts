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
			// Re-render when the Pre-bind FSM transitions (via preBindFailed or callEnded events).
			// The native-answer transition itself must be signalled separately via a custom event
			// or store field if the consumer needs to react to awaitingMediaCall entry.
			// For the common case (isInActiveVoipCall gating), callEnded covers the exit path;
			// preBindFailed covers the cleanup path. The entry path is covered by store.call
			// being set shortly after answerIncoming binds the MediaCall.
			const unsubPreBindFailed = callLifecycle.emitter.on('preBindFailed', subscribe);
			const unsubCallEnded = callLifecycle.emitter.on('callEnded', subscribe);
			return () => {
				unsubPreBindFailed();
				unsubCallEnded();
			};
		},
		() => callLifecycle.preBindStatus().kind === 'awaitingMediaCall'
	);

	return call != null || isPreBind;
};

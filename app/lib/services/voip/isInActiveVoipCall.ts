import { useCallStore } from './useCallStore';

/** True when there is an active VoIP call — either a bound call or a native-accepted id pending bind. */
export function isInActiveVoipCall(): boolean {
	const { call, nativeAcceptedCallId } = useCallStore.getState();
	return call != null || nativeAcceptedCallId != null;
}

/** Reactive hook form of {@link isInActiveVoipCall}. */
export const useIsInActiveVoipCall = (): boolean =>
	useCallStore(state => state.call != null || state.nativeAcceptedCallId != null);

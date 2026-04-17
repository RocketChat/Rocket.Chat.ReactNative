import { useCallStore } from './useCallStore';

/** Resets VoIP UI / native-call-id state after accept failure or similar teardown (deep linking saga). */
export function resetVoipState(): void {
	const { resetNativeCallId, reset } = useCallStore.getState();
	resetNativeCallId();
	reset();
}

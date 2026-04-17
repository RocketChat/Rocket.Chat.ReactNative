import { useCallStore } from './useCallStore';

/** Resets VoIP Zustand slice after native accept failure (deep-linking saga). */
export function resetVoipState(): void {
	const { resetNativeCallId, reset } = useCallStore.getState();
	resetNativeCallId();
	reset();
}

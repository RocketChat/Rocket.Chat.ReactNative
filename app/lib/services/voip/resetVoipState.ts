import { useCallStore } from './useCallStore';
import { clearVoipAcceptDedupeSentinels } from './MediaCallEvents';
import { clearTerminateDedupeSentinels } from './terminateNativeCall';

/** Resets VoIP UI / native-call-id state after accept failure or similar teardown (deep linking saga). Also clears the accept- and terminate-dedupe sentinels so Android cold-start and re-delivery paths are not poisoned by a prior call. */
export function resetVoipState(): void {
	clearVoipAcceptDedupeSentinels();
	clearTerminateDedupeSentinels();
	const { resetNativeCallId, reset } = useCallStore.getState();
	resetNativeCallId();
	reset();
}

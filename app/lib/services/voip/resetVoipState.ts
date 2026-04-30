import { useCallStore } from './useCallStore';
import { clearVoipAcceptDedupeSentinels } from './MediaCallEvents';
import { callLifecycle } from './CallLifecycle';

/**
 * Resets VoIP UI state after accept failure or similar teardown (deep linking saga).
 * Also clears accept-dedupe sentinels so Android cold-start and re-delivery paths are
 * not poisoned by a prior call.
 *
 * Calls callLifecycle.end('error') to collapse any non-idle Pre-bind FSM state to idle.
 * This ensures that logout / server-switch / deeplink-failed paths don't leave the FSM
 * stuck in awaitingMediaCall (which would trigger the 60s cleanup timer).
 */
export function resetVoipState(): void {
	clearVoipAcceptDedupeSentinels();
	// Collapse FSM to idle (clears awaitingMediaCall / failed states and cancels cleanup timer).
	// end() is idempotent — safe to call when already idle.
	callLifecycle.end('error');
	useCallStore.getState().reset();
}

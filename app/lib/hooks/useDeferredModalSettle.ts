import { useRef } from 'react';

interface ISettleableRequest {
	cancel?: () => void;
}

/**
 * Lifecycle for event-emitter-driven modals (ScreenLockedView, ChangePasscodeView) whose callers
 * await a promise the modal must settle (submit → resolve, cancel → reject).
 *
 * Two races are handled so no caller's promise is ever orphaned:
 * - The settle callback is deferred until the modal finishes animating out (`onModalHide`), so a
 *   new request arriving mid-animation flushes the previous session's settle instead of losing it.
 * - A new request arriving while the previous one is still awaiting user input cancels the
 *   previous request, rejecting its caller's promise instead of leaving it hanging forever.
 */
export const useDeferredModalSettle = <T extends ISettleableRequest>() => {
	const pendingSettle = useRef<(() => void) | null>(null);
	const activeRequest = useRef<T | null>(null);

	// Call when a new request arrives, before storing it in state.
	const onShow = (args: T) => {
		const flush = pendingSettle.current;
		pendingSettle.current = null;
		flush?.();
		const previous = activeRequest.current;
		activeRequest.current = args;
		previous?.cancel?.();
	};

	// Call when the user settles the modal; `settle` runs once the modal has animated out.
	const defer = (settle: (() => void) | null) => {
		activeRequest.current = null;
		pendingSettle.current = settle;
	};

	const onModalHide = () => {
		const settle = pendingSettle.current;
		pendingSettle.current = null;
		settle?.();
	};

	return { onShow, defer, onModalHide };
};

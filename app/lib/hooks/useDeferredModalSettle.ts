import { useRef } from 'react';

interface ISettleableRequest {
	cancel?: () => void;
}

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
		// First settle wins: two can land in one batch, and overwriting drops the one that already won.
		if (pendingSettle.current) {
			return;
		}
		pendingSettle.current = settle;
	};

	const onModalHide = () => {
		const settle = pendingSettle.current;
		pendingSettle.current = null;
		settle?.();
	};

	return { onShow, defer, onModalHide };
};

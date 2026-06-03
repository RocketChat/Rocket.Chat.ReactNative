import { useCallback, useRef, type RefObject } from 'react';
import { type View } from 'react-native';

import { setAccessibilityFocus } from './setAccessibilityFocus';

let lastRef: RefObject<View | null> | null = null;

export const useLastFocusedMessageRef = () => {
	const ref = useRef<View>(null);

	const markAsLastFocused = useCallback(() => {
		lastRef = ref;
	}, []);

	const get = (): RefObject<View | null> | null => lastRef;

	const clear = (): void => {
		lastRef = null;
	};

	// Builds an action sheet `onClose` handler that clears the stored ref and restores
	// accessibility focus to the message that opened it. Returns undefined when there is
	// nothing to restore. `delay` is owned by the caller so this lib stays free of any
	// container-level timing constants.
	const restoreFocusOnClose = (delay: number): (() => void) | undefined => {
		const target = lastRef;
		if (!target) return undefined;
		return () => {
			clear();
			setTimeout(() => setAccessibilityFocus(target), delay);
		};
	};

	return { ref, markAsLastFocused, get, clear, restoreFocusOnClose };
};

import { useCallback, useRef, type RefObject } from 'react';
import { type View } from 'react-native';

let lastRef: RefObject<View | null> | null = null;

export const useLastFocusedMessageRef = () => {
	const ref = useRef<View>(null);

	const markAsLastFocused = useCallback(() => {
		lastRef = ref;
	}, []);

	const get = useCallback((): RefObject<View | null> | null => lastRef, []);

	const clear = useCallback((): void => {
		lastRef = null;
	}, []);

	return { ref, markAsLastFocused, get, clear };
};

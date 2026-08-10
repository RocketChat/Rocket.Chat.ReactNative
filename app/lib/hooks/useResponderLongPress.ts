import { useEffect, useRef } from 'react';
import { type GestureResponderEvent } from 'react-native';

// Detects a long press through React Native's JS responder system instead of a gesture handler, so that
// nested press targets win by depth. A gesture-handler parent cannot be cancelled by a plain
// <Text onLongPress> child, which is how a long press on a markdown link also opened the message actions.
// Matches Pressability's default so the feel is unchanged.
const LONG_PRESS_DELAY = 500;

export const useResponderLongPress = (onLongPress?: (event: GestureResponderEvent) => void, enabled = true) => {
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clear = () => {
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = null;
		}
	};

	useEffect(() => clear, []);

	if (!onLongPress || !enabled) {
		return null;
	}

	return {
		onStartShouldSetResponder: () => true,
		// Let an ancestor scroll view take the touch over, which cancels the pending long press.
		onResponderTerminationRequest: () => true,
		onResponderGrant: (event: GestureResponderEvent) => {
			clear();
			timeout.current = setTimeout(() => onLongPress(event), LONG_PRESS_DELAY);
		},
		onResponderRelease: clear,
		onResponderTerminate: clear
	};
};

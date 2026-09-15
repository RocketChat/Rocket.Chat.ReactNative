import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type HeaderAction } from '~/lib/methods/helpers/navigation';

import { useVideoConf } from '~/lib/hooks/useVideoConf';
import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';

const DOUBLE_TAP_WINDOW_MS = 300;

export const useHeaderCallAction = ({
	rid,
	disabled,
	accessibilityLabel
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}): Extract<HeaderAction, { type: 'button' }> | null => {
	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const { openNewMediaCall, startCallImmediate, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);

	const lastTapRef = useRef(0);
	const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (pendingTimerRef.current) {
				clearTimeout(pendingTimerRef.current);
				pendingTimerRef.current = null;
			}
		},
		[]
	);

	const handlers = useRef({ openNewMediaCall, startCallImmediate, showInitCallActionSheet });
	useEffect(() => {
		handlers.current = { openNewMediaCall, startCallImmediate, showInitCallActionSheet };
	});

	const handleVoipPress = useCallback(() => {
		const now = Date.now();
		if (pendingTimerRef.current && now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
			clearTimeout(pendingTimerRef.current);
			pendingTimerRef.current = null;
			lastTapRef.current = 0;
			handlers.current.startCallImmediate();
			return;
		}
		lastTapRef.current = now;
		pendingTimerRef.current = setTimeout(() => {
			pendingTimerRef.current = null;
			handlers.current.openNewMediaCall();
		}, DOUBLE_TAP_WINDOW_MS);
	}, []);

	const handleVideoPress = useCallback(() => {
		handlers.current.showInitCallActionSheet();
	}, []);

	return useMemo(() => {
		if (!hasMediaCallPermission && !callEnabled) {
			return null;
		}
		return {
			type: 'button',
			label: accessibilityLabel,
			accessibilityLabel,
			disabled: disabled || isInActiveCall || (!hasMediaCallPermission && !!disabledTooltip),
			iconName: 'phone',
			onPress: hasMediaCallPermission ? handleVoipPress : handleVideoPress,
			testID: 'room-view-header-call'
		};
	}, [
		accessibilityLabel,
		disabled,
		isInActiveCall,
		hasMediaCallPermission,
		callEnabled,
		disabledTooltip,
		handleVoipPress,
		handleVideoPress
	]);
};

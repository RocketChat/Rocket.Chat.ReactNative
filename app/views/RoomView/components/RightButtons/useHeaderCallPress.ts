import { useEffect, useRef } from 'react';

import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { useVideoConf } from '~/lib/hooks/useVideoConf';

const DOUBLE_TAP_WINDOW_MS = 300;

export const useHeaderCallPress = (rid: string) => {
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

	const onPressMediaCall = () => {
		const now = Date.now();
		if (pendingTimerRef.current && now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
			clearTimeout(pendingTimerRef.current);
			pendingTimerRef.current = null;
			lastTapRef.current = 0;
			startCallImmediate();
			return;
		}
		lastTapRef.current = now;
		pendingTimerRef.current = setTimeout(() => {
			pendingTimerRef.current = null;
			openNewMediaCall();
		}, DOUBLE_TAP_WINDOW_MS);
	};

	if (hasMediaCallPermission) {
		return {
			callPresent: true,
			hasMediaCallPermission,
			isCallDisabled: isInActiveCall,
			onPressCall: onPressMediaCall
		};
	}

	if (callEnabled) {
		return {
			callPresent: true,
			hasMediaCallPermission,
			isCallDisabled: disabledTooltip || isInActiveCall,
			onPressCall: showInitCallActionSheet
		};
	}

	return {
		callPresent: false,
		hasMediaCallPermission,
		isCallDisabled: true,
		onPressCall: () => {}
	};
};

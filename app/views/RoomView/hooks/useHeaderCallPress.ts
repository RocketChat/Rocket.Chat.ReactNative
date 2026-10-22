import { useEffect, useRef } from 'react';

import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { useVideoConf } from '~/lib/hooks/useVideoConf';
import { isGroupChat } from '~/lib/methods/helpers/helpers';
import { useIsInPexipCall } from '~/lib/services/videoConf/usePexipCallStore';

const DOUBLE_TAP_WINDOW_MS = 300;

export const useHeaderCallPress = (rid: string) => {
	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const { openNewMediaCall, startCallImmediate, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);
	const isInPexipCall = useIsInPexipCall();
	const room = useSubscription(rid);
	const isDirect = room?.t === 'd' && !isGroupChat(room);

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

	return {
		callPresent: hasMediaCallPermission && isDirect,
		isCallDisabled: isInActiveCall,
		onPressCall: onPressMediaCall,
		videoCallPresent: callEnabled,
		isVideoCallDisabled: disabledTooltip || isInActiveCall || isInPexipCall,
		onPressVideoCall: showInitCallActionSheet
	};
};

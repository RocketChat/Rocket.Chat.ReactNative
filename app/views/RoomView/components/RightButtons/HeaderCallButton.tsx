import { type ReactElement, useEffect, useRef } from 'react';

import i18n from '~/i18n';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import { useVideoConf } from '~/lib/hooks/useVideoConf';
import { useNewMediaCall } from '~/lib/hooks/useNewMediaCall';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { useIsInPexipCall } from '~/lib/services/videoConf/usePexipCallStore';
import { isGroupChat } from '~/lib/methods/helpers/helpers';

const DOUBLE_TAP_WINDOW_MS = 300;

export const HeaderCallButton = ({
	rid,
	disabled,
	accessibilityLabel
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}): ReactElement | null => {
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

	const handleVoipPress = () => {
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

	const showVoiceCall = hasMediaCallPermission && isDirect;

	if (!showVoiceCall && !callEnabled) return null;

	return (
		<>
			{showVoiceCall ? (
				<HeaderButton.Item
					accessibilityLabel={accessibilityLabel}
					disabled={disabled || isInActiveCall}
					iconName='phone'
					onPress={handleVoipPress}
					testID='room-view-header-call'
				/>
			) : null}
			{callEnabled ? (
				<HeaderButton.Item
					accessibilityLabel={i18n.t('Video_call')}
					disabled={disabledTooltip || disabled || isInActiveCall || isInPexipCall}
					iconName='video'
					onPress={showInitCallActionSheet}
					testID='room-view-header-video-call'
				/>
			) : null}
		</>
	);
};

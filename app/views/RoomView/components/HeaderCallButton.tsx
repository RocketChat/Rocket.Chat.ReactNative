import React, { useEffect, useRef } from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useNewMediaCall } from '../../../lib/hooks/useNewMediaCall';
import { useIsInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';

const DOUBLE_TAP_WINDOW_MS = 300;

export const HeaderCallButton = ({
	rid,
	disabled,
	accessibilityLabel
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}): React.ReactElement | null => {
	'use memo';

	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const { openNewMediaCall, startCallImmediate, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);
	const isInActiveVoipCall = useIsInActiveVoipCall();

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

	if (hasMediaCallPermission) {
		return (
			<HeaderButton.Item
				accessibilityLabel={accessibilityLabel}
				disabled={disabled || isInActiveCall}
				iconName='phone'
				onPress={handleVoipPress}
				testID='room-view-header-call'
			/>
		);
	}

	if (callEnabled) {
		return (
			<HeaderButton.Item
				accessibilityLabel={accessibilityLabel}
				disabled={disabledTooltip || disabled || isInActiveVoipCall}
				iconName='phone'
				onPress={showInitCallActionSheet}
				testID='room-view-header-call'
			/>
		);
	}

	return null;
};

import React from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
// import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { mediaSessionInstance } from '../../../lib/services/voip/MediaSessionInstance';
import type { TSubscriptionModel } from '../../../definitions';

export const HeaderCallButton = ({
	// rid,
	disabled,
	accessibilityLabel,
	room
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
	room?: TSubscriptionModel;
}): React.ReactElement | null => {
	// const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);

	// if (callEnabled)
	// 	return (
	// 		<HeaderButton.Item
	// 			accessibilityLabel={accessibilityLabel}
	// 			disabled={disabledTooltip || disabled}
	// 			iconName='phone'
	// 			onPress={showInitCallActionSheet}
	// 			testID='room-view-header-call'
	// 		/>
	// 	);
	// return null;
	// const toggleFocus = useCallStore(state => state.toggleFocus);
	// void session.startCall(peerInfo.userId, 'user');

	const handlePress = () => {
		if (!room) return;
		mediaSessionInstance.startCallByRoom(room);
	};

	return (
		<HeaderButton.Item
			accessibilityLabel={accessibilityLabel}
			disabled={disabled}
			iconName='phone'
			onPress={handlePress}
			testID='room-view-header-call'
		/>
	);
};

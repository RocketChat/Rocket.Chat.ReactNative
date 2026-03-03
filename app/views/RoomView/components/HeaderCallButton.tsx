import React from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { mediaSessionInstance } from '../../../lib/services/voip/MediaSessionInstance';
import type { TSubscriptionModel } from '../../../definitions';
import { useMediaCallPermission } from '../../../lib/hooks/useMediaCallPermission';

export const HeaderCallButton = ({
	rid,
	disabled,
	accessibilityLabel,
	room
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
	room?: TSubscriptionModel;
}): React.ReactElement | null => {
	'use memo';

	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const hasMediaCallPermission = useMediaCallPermission();

	if (hasMediaCallPermission) {
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
	}

	if (callEnabled) {
		return (
			<HeaderButton.Item
				accessibilityLabel={accessibilityLabel}
				disabled={disabledTooltip || disabled}
				iconName='phone'
				onPress={showInitCallActionSheet}
				testID='room-view-header-call'
			/>
		);
	}

	return null;
};

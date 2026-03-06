import React from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useMediaCallPermission } from '../../../lib/hooks/useMediaCallPermission';
import { NewMediaCall } from '../../../containers/NewMediaCall';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { usePeerAutocompleteStore } from '../../../lib/services/voip/usePeerAutocompleteStore';
import { useSubscription } from '../../../lib/hooks/useSubscription';

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

	const room = useSubscription(rid);
	const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const hasMediaCallPermission = useMediaCallPermission();

	if (hasMediaCallPermission) {
		const handlePress = () => {
			if (!room) return;
			const otherUserId = getUidDirectMessage(room);
			if (!otherUserId) return;
			usePeerAutocompleteStore.getState().setSelectedPeer({ type: 'user', value: otherUserId, label: room.name });
			showActionSheetRef({
				children: <NewMediaCall />
			});
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

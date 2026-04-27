import React from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useNewMediaCall } from '../../../lib/hooks/useNewMediaCall';
import { useIsInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';

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
	const { openNewMediaCall, hasMediaCallPermission, isInActiveCall } = useNewMediaCall(rid);
	const isInActiveVoipCall = useIsInActiveVoipCall();

	if (hasMediaCallPermission) {
		return (
			<HeaderButton.Item
				accessibilityLabel={accessibilityLabel}
				disabled={disabled || isInActiveCall}
				iconName='phone'
				onPress={openNewMediaCall}
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

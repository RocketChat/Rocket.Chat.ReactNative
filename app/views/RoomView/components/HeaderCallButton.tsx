import React from 'react';

import * as HeaderButton from '../../../containers/Header/components/HeaderButton';
// import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useCallStore } from '../../../lib/services/voip/useCallStore';

export const HeaderCallButton = ({
	// rid,
	disabled,
	accessibilityLabel
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
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
	const toggleFocus = useCallStore(state => state.toggleFocus);
	return (
		<HeaderButton.Item
			accessibilityLabel={accessibilityLabel}
			disabled={disabled}
			iconName='phone'
			onPress={() => toggleFocus()}
			testID='room-view-header-call'
		/>
	);
};

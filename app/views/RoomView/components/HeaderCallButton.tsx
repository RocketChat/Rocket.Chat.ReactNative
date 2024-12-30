import React from 'react';

import * as HeaderButton from '../../../containers/HeaderButton';
// import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { useStartCall } from '../../../lib/hooks/useStartCall';

export const HeaderCallButton = ({
	rid,
	ruid /* , disabled*/
}: {
	rid: string;
	ruid: string;
	disabled: boolean;
}): React.ReactElement | null => {
	// const { showInitCallActionSheet, callEnabled, disabledTooltip } = useVideoConf(rid);
	const { startCall } = useStartCall({ rid, ruid });

	// if (callEnabled)
	return (
		<HeaderButton.Item
			// disabled={disabledTooltip || disabled}
			iconName='phone'
			onPress={startCall}
			testID='room-view-header-call'
		/>
	);
	// return null;
};

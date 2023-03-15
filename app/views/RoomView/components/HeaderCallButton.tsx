import React from 'react';

import * as HeaderButton from '../../../containers/HeaderButton';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';

export default function HeaderCallButton({ rid }: { rid: string }): React.ReactElement | null {
	const { showInitCallActionSheet, showCallOption } = useVideoConf(rid);

	if (showCallOption)
		return <HeaderButton.Item iconName='phone' onPress={showInitCallActionSheet} testID='room-view-header-call' />;
	return null;
}

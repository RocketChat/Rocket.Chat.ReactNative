import React from 'react';

import * as HeaderButton from '../../../containers/HeaderButton';
import { ISubscription } from '../../../definitions';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';

export default function HeaderCallIcon({
	room
}: {
	room: Pick<ISubscription, 'rid' | 't' | 'usernames' | 'name' | 'teamMain'>;
}): React.ReactElement | null {
	const { initCall, showCallOption } = useVideoConf(room);

	if (showCallOption) return <HeaderButton.Item iconName='phone' onPress={initCall} testID='room-view-header-call' />;
	return null;
}

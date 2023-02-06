import React from 'react';

import * as List from '../../../containers/List';
import { ISubscription } from '../../../definitions';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';

export default function CallSection({
	room
}: {
	room: Pick<ISubscription, 'rid' | 't' | 'usernames' | 'name' | 'teamMain'>;
}): React.ReactElement | null {
	const { showCallOption, initCall } = useVideoConf(room);

	if (showCallOption)
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title='Call'
					onPress={initCall}
					testID='room-actions-call'
					left={() => <List.Icon name='phone' />}
					showActionIndicator
				/>
				<List.Separator />
			</List.Section>
		);
	return null;
}

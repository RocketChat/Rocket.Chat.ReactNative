import React from 'react';

import * as List from '../../../containers/List';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import type { TSubscriptionModel } from '../../../definitions';
import { useNewMediaCall } from '../../../lib/hooks/useNewMediaCall';

export default function CallSection({
	room,
	disabled
}: {
	room: TSubscriptionModel;
	disabled: boolean;
}): React.ReactElement | null {
	const { callEnabled, showInitCallActionSheet, disabledTooltip } = useVideoConf(room.rid);
	const { openNewMediaCall, hasMediaCallPermission } = useNewMediaCall(room.rid);

	if (!hasMediaCallPermission && !callEnabled) {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			{hasMediaCallPermission ? (
				<>
					<List.Item
						title={'Voice_call'}
						onPress={openNewMediaCall}
						testID='room-actions-voice-call'
						left={() => <List.Icon name='phone' />}
						showActionIndicator
						disabled={disabledTooltip || disabled}
					/>
					<List.Separator />
				</>
			) : null}
			{callEnabled ? (
				<>
					<List.Item
						title={'Video_call'}
						onPress={showInitCallActionSheet}
						testID='room-actions-call'
						left={() => <List.Icon name='video' />}
						showActionIndicator
						disabled={disabledTooltip || disabled}
					/>
					<List.Separator />
				</>
			) : null}
		</List.Section>
	);
}

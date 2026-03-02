import React from 'react';

import * as List from '../../../containers/List';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import { mediaSessionInstance } from '../../../lib/services/voip/MediaSessionInstance';
import type { TSubscriptionModel } from '../../../definitions';

export default function CallSection({
	room,
	disabled
}: {
	room: TSubscriptionModel;
	disabled: boolean;
}): React.ReactElement | null {
	const { callEnabled, showInitCallActionSheet, disabledTooltip } = useVideoConf(room.rid);

	const handleVoiceCallPress = () => {
		if (!room) return;
		mediaSessionInstance.startCallByRoom(room);
	};
	return (
		<List.Section>
			<List.Separator />
			{/* TODO: check if the user has the permission to call */}
			<List.Item
				title={'Voice_call'}
				onPress={handleVoiceCallPress}
				testID='room-actions-voice-call'
				left={() => <List.Icon name='phone' />}
				showActionIndicator
				disabled={disabledTooltip || disabled}
			/>
			<List.Separator />
			{!callEnabled ? (
				<>
					<List.Item
						title={'Video_call'}
						onPress={showInitCallActionSheet}
						testID='room-actions-call'
						left={() => <List.Icon name='camera' />}
						showActionIndicator
						disabled={disabledTooltip || disabled}
					/>
					<List.Separator />
				</>
			) : null}
		</List.Section>
	);

	// TODO: return null if the user has no permission to voice/video
	// return null;
}

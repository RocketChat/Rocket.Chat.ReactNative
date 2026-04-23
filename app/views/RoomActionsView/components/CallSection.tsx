import React, { useEffect, useState } from 'react';

import * as List from '../../../containers/List';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';
import type { TSubscriptionModel } from '../../../definitions';
import { useNewMediaCall } from '../../../lib/hooks/useNewMediaCall';
import { videoConferenceGetCapabilities } from '../../../lib/services/restApi';

export default function CallSection({
	room,
	disabled,
	itsMe
}: {
	room: TSubscriptionModel;
	disabled: boolean;
	itsMe?: boolean;
}): React.ReactElement | null {
	const { callEnabled, showInitCallActionSheet, disabledTooltip } = useVideoConf(room.rid);
	const { openNewMediaCall, hasMediaCallPermission } = useNewMediaCall(room.rid);
	const [providerName, setProviderName] = useState<string>();

	useEffect(() => {
		if (callEnabled) {
			videoConferenceGetCapabilities()
				.then((res: any) => setProviderName(res.providerName))
				.catch(() => {});
		}
	}, [callEnabled]);

	const showVoiceCall = hasMediaCallPermission && !itsMe;

	if (!showVoiceCall && !callEnabled) {
		return null;
	}

	return (
		<List.Section>
			<List.Separator />
			{showVoiceCall ? (
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
						subtitle={providerName ? `(${providerName})` : undefined}
						translateSubtitle={false}
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

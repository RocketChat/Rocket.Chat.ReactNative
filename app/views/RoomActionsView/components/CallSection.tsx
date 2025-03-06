import React from 'react';

import * as List from '../../../containers/List';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';

export default function CallSection({ rid, disabled }: { rid: string; disabled: boolean }): React.ReactElement | null {
	const { callEnabled, showInitCallActionSheet, disabledTooltip } = useVideoConf(rid);
	if (callEnabled)
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title={'Call'}
					onPress={showInitCallActionSheet}
					testID='room-actions-call'
					left={() => <List.Icon name='phone' />}
					showActionIndicator
					disabled={disabledTooltip || disabled}
				/>
				<List.Separator />
			</List.Section>
		);
	return null;
}

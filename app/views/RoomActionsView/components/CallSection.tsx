import React from 'react';

import * as List from '../../../containers/List';
import i18n from '../../../i18n';
import { useVideoConf } from '../../../lib/hooks/useVideoConf';

export default function CallSection({ rid }: { rid: string }): React.ReactElement | null {
	const { showCallOption, showInitCallActionSheet } = useVideoConf(rid);

	if (showCallOption)
		return (
			<List.Section>
				<List.Separator />
				<List.Item
					title={i18n.t('Call')}
					onPress={showInitCallActionSheet}
					testID='room-actions-call'
					left={() => <List.Icon name='phone' />}
					showActionIndicator
				/>
				<List.Separator />
			</List.Section>
		);
	return null;
}

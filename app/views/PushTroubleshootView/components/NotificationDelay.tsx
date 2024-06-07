import React from 'react';
import { Linking } from 'react-native';

import * as List from '../../../containers/List';
import { useTheme } from '../../../theme';

export default function NotificationDelay(): React.ReactElement {
	const { colors } = useTheme();

	const openNotificationDocumentation = () => Linking.openURL('https://go.rocket.chat/i/push-notifications');

	return (
		<List.Section title='Notification_delay'>
			<List.Separator />
			<List.Item
				title='Documentation'
				onPress={openNotificationDocumentation}
				right={() => <List.Icon size={32} name='new-window' color={colors.fontAnnotation} />}
				testID='push-troubleshoot-view-notification-delay'
			/>
			<List.Separator />
			<List.Info info='Notification_delay_description' />
		</List.Section>
	);
}

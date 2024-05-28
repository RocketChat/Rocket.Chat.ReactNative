import notifee from '@notifee/react-native';
import React from 'react';
import { Linking } from 'react-native';

import * as List from '../../../containers/List';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { isIOS, showErrorAlert } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import CustomListSection from './CustomListSection';

export default function DeviceNotificationSettings(): React.ReactElement {
	const { colors } = useTheme();
	const { deviceNotificationEnabled } = useAppSelector(state => ({
		deviceNotificationEnabled: state.troubleshootingNotification.deviceNotificationEnabled
	}));

	const goToNotificationSettings = () => {
		if (isIOS) {
			Linking.openURL('app-settings:');
		} else {
			notifee.openNotificationSettings();
		}
	};

	const alertDeviceNotificationSettings = () => {
		if (deviceNotificationEnabled) return;
		showErrorAlert(
			i18n.t('Device_notifications_alert_description'),
			i18n.t('Device_notifications_alert_title'),
			goToNotificationSettings
		);
	};

	return (
		<CustomListSection
			title='Device_notification_settings'
			statusColor={!deviceNotificationEnabled ? colors.userPresenceBusy : colors.userPresenceOnline}>
			<List.Separator />
			<List.Item
				title={!deviceNotificationEnabled ? 'Allow_push_notifications_for_rocket_chat' : 'No_further_action_is_needed'}
				onPress={alertDeviceNotificationSettings}
				testID='push-troubleshoot-view-allow-push-notifications'
				disabled={deviceNotificationEnabled}
			/>
			<List.Separator />
		</CustomListSection>
	);
}

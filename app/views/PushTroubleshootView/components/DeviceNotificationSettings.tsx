import { Linking } from 'react-native';
import { type ReactElement } from 'react';

import * as List from '~/containers/List';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { isIOS, showErrorAlert } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import { CustomIcon } from '~/containers/CustomIcon';
import { asNativeListSection } from '~/containers/List/native/rowMarkers';

function DeviceNotificationSettings(): ReactElement {
	const { colors } = useTheme();
	const { deviceNotificationEnabled } = useAppSelector(state => ({
		deviceNotificationEnabled: state.troubleshootingNotification.deviceNotificationEnabled
	}));

	const goToNotificationSettings = () => {
		if (isIOS) {
			Linking.openURL('app-settings:');
		} else {
			Linking.openSettings();
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
		<List.Section title='Device_notification_settings'>
			<List.Separator />
			<List.Item
				title={!deviceNotificationEnabled ? 'Allow_push_notifications_for_rocket_chat' : 'No_further_action_is_needed'}
				onPress={alertDeviceNotificationSettings}
				testID='push-troubleshoot-view-allow-push-notifications'
				disabled={deviceNotificationEnabled}
				right={() => (
					<CustomIcon
						name='status-online'
						size={16}
						color={!deviceNotificationEnabled ? colors.userPresenceBusy : colors.userPresenceOnline}
					/>
				)}
			/>
			<List.Separator />
		</List.Section>
	);
}

export default asNativeListSection(DeviceNotificationSettings);

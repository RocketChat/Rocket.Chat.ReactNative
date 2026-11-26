import { type ReactElement } from 'react';

import * as List from '~/containers/List';
import i18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { openAppSettings } from '~/lib/methods/helpers/openAppSettings';
import { useTheme } from '~/theme';
import StatusDot from './StatusDot';

function DeviceNotificationSettings(): ReactElement {
	const { colors } = useTheme();
	const { deviceNotificationEnabled } = useAppSelector(state => ({
		deviceNotificationEnabled: state.troubleshootingNotification.deviceNotificationEnabled
	}));

	const goToNotificationSettings = () => {
		openAppSettings();
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
		<List.Section
			title='Device_notification_settings'
			headerTrailing={<StatusDot color={!deviceNotificationEnabled ? colors.userPresenceBusy : colors.userPresenceOnline} />}>
			<List.Separator />
			<List.Item
				title={!deviceNotificationEnabled ? 'Allow_push_notifications_for_rocket_chat' : 'No_further_action_is_needed'}
				onPress={alertDeviceNotificationSettings}
				testID='push-troubleshoot-view-allow-push-notifications'
				disabled={deviceNotificationEnabled}
			/>
			<List.Separator />
		</List.Section>
	);
}

export default DeviceNotificationSettings;

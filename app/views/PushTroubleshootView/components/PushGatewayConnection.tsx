import React, { useState } from 'react';
import { Alert } from 'react-native';

import * as List from '../../../containers/List';
import i18n from '../../../i18n';
import { useAppSelector, usePermissions } from '../../../lib/hooks';
import { compareServerVersion, showErrorAlertWithEMessage } from '../../../lib/methods/helpers';
import { Services } from '../../../lib/services';
import { useTheme } from '../../../theme';
import CustomListSection from './CustomListSection';

export default function PushGatewayConnection(): React.ReactElement | null {
	const [loading, setLoading] = useState(false);
	const { colors } = useTheme();
	const [testPushNotificationsPermission] = usePermissions(['test-push-notifications']);
	const { defaultPushGateway, pushGatewayEnabled, serverVersion } = useAppSelector(state => ({
		pushGatewayEnabled: state.troubleshootingNotification.pushGatewayEnabled,
		defaultPushGateway: state.troubleshootingNotification.defaultPushGateway,
		foreground: state.app.foreground,
		serverVersion: state.server.version
	}));

	if (!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.6.0')) return null;

	const handleTestPushNotification = async () => {
		setLoading(true);
		try {
			const result = await Services.pushTest();
			if (result.success) {
				Alert.alert(i18n.t('Test_push_notification'), i18n.t('Your_push_was_sent_to_s_devices', { s: result.tokensCount }));
			}
		} catch (error: any) {
			showErrorAlertWithEMessage(error, i18n.t('Test_push_notification'));
		}
		setLoading(false);
	};

	let infoColor = 'Push_gateway_not_connected_description';
	let statusColor = colors.userPresenceBusy;
	if (pushGatewayEnabled) {
		statusColor = colors.userPresenceOnline;
		infoColor = 'Push_gateway_connected_description';
	}
	if (pushGatewayEnabled && !defaultPushGateway) {
		statusColor = colors.badgeBackgroundLevel3;
		infoColor = 'Custom_push_gateway_connected_description';
	}

	return (
		<CustomListSection
			title={!defaultPushGateway ? 'Custom_push_gateway_connection' : 'Push_gateway_connection'}
			statusColor={statusColor}>
			<List.Separator />
			<List.Item
				title='Test_push_notification'
				disabled={!pushGatewayEnabled || !testPushNotificationsPermission || loading}
				onPress={handleTestPushNotification}
				testID='push-troubleshoot-view-push-gateway-connection'
			/>
			<List.Separator />
			<List.Info info={infoColor} />
		</CustomListSection>
	);
}

import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import notifee from '@notifee/react-native';
import { useDispatch } from 'react-redux';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { SettingsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import CustomListSection from './components/CustomListSection';
import { compareServerVersion, isIOS, showErrorAlert } from '../../lib/methods/helpers';
import { requestTroubleshootingNotification } from '../../actions/troubleshootingNotification';
import { useAppSelector, usePermissions } from '../../lib/hooks';
import { Services } from '../../lib/services';
// TODO: This will be used in the near future when the consumption percentage is implemented on the server.
// import ListPercentage from './components/ListPercentage';

interface IPushTroubleshootViewProps {
	navigation: StackNavigationProp<SettingsStackParamList, 'PushTroubleshootView'>;
}

const PushTroubleshootView = ({ navigation }: IPushTroubleshootViewProps): JSX.Element => {
	const { colors } = useTheme();

	const dispatch = useDispatch();
	const { deviceNotificationEnabled, defaultPushGateway, pushGatewayEnabled, foreground, serverVersion } = useAppSelector(
		state => ({
			deviceNotificationEnabled: state.troubleshootingNotification.deviceNotificationEnabled,
			pushGatewayEnabled: state.troubleshootingNotification.pushGatewayEnabled,
			defaultPushGateway: state.troubleshootingNotification.defaultPushGateway,
			foreground: state.app.foreground,
			serverVersion: state.server.version
			// TODO: This will be used in the near future when the consumption percentage is implemented on the server.
			// isCommunityEdition: state.troubleshootingNotification.isCommunityEdition,
			// consumptionPercentage: state.troubleshootingNotification.consumptionPercentage,
		})
	);

	const [testPushNotificationsPermission] = usePermissions(['test-push-notifications']);

	useEffect(() => {
		if (foreground) {
			dispatch(requestTroubleshootingNotification());
		}
	}, [dispatch, foreground]);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Push_Troubleshooting')
		});
	}, [navigation]);

	const openNotificationDocumentation = async () => {
		await Linking.openURL('https://docs.rocket.chat/use-rocket.chat/rocket.chat-mobile/push-notifications');
	};

	const alertDeviceNotificationSettings = () => {
		showErrorAlert(
			I18n.t('Device_notifications_alert_description'),
			I18n.t('Device_notifications_alert_title'),
			goToNotificationSettings
		);
	};

	// TODO: This will be used in the near future when the consumption percentage is implemented on the server.
	// const alertWorkspaceConsumption = () => {
	// 	Alert.alert(I18n.t('Push_consumption_alert_title'), I18n.t('Push_consumption_alert_description'));
	// };

	const goToNotificationSettings = () => {
		if (isIOS) {
			Linking.openURL('app-settings:');
		} else {
			notifee.openNotificationSettings();
		}
	};

	const handleTestPushNotification = async () => {
		let message = '';
		try {
			const result = await Services.pushTest();
			message = I18n.t('Your_push_was_sent_to_s_devices', { s: result.params[0] });
		} catch (error: any) {
			message = I18n.isTranslated(error?.error) ? I18n.t(error?.error) : error?.message;
		} finally {
			Alert.alert(I18n.t('Test_push_notification'), message);
		}
	};

	let pushGatewayInfoDescription = 'Push_gateway_not_connected_description';
	let pushGatewayStatusColor = colors.userPresenceBusy;
	if (pushGatewayEnabled) {
		pushGatewayStatusColor = colors.userPresenceOnline;
		pushGatewayInfoDescription = 'Push_gateway_connected_description';
	}
	if (pushGatewayEnabled && !defaultPushGateway) {
		pushGatewayStatusColor = colors.badgeBackgroundLevel3;
		pushGatewayInfoDescription = 'Custom_push_gateway_connected_description';
	}

	return (
		<SafeAreaView testID='push-troubleshoot-view'>
			<StatusBar />
			<List.Container testID='push-troubleshoot-view-list'>
				<CustomListSection
					title='Device_notification_settings'
					statusColor={!deviceNotificationEnabled ? colors.userPresenceBusy : colors.userPresenceOnline}
				>
					<List.Separator />
					<List.Item
						title={!deviceNotificationEnabled ? 'Allow_push_notifications_for_rocket_chat' : 'Go_to_device_settings'}
						onPress={!deviceNotificationEnabled ? alertDeviceNotificationSettings : undefined}
						testID='push-troubleshoot-view-allow-push-notifications'
					/>
					<List.Separator />
				</CustomListSection>

				{/* TODO: This will be used in the near future when the consumption percentage is implemented on the server.
				{isCommunityEdition ? (
					<List.Section title='Community_edition_push_quota'>
						<List.Separator />
						<ListPercentage
							title='Workspace_consumption'
							onPress={alertWorkspaceConsumption}
							testID='push-troubleshoot-view-workspace-consumption'
							value={consumptionPercentage}
						/>
						<List.Separator />
						<List.Info info='Workspace_consumption_description' />
					</List.Section>
				) : null} */}

				{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.5.0') ? (
					<CustomListSection
						title={!defaultPushGateway ? 'Custom_push_gateway_connection' : 'Push_gateway_connection'}
						statusColor={pushGatewayStatusColor}
					>
						<List.Separator />
						<List.Item
							title='Test_push_notification'
							disabled={!pushGatewayEnabled || !testPushNotificationsPermission}
							onPress={handleTestPushNotification}
							testID='push-troubleshoot-view-push-gateway-connection'
						/>
						<List.Separator />
						<List.Info info={pushGatewayInfoDescription} />
					</CustomListSection>
				) : null}

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
			</List.Container>
		</SafeAreaView>
	);
};

export default PushTroubleshootView;

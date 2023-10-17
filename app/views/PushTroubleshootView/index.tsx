import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Alert, Linking } from 'react-native';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { SettingsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import CustomListSection from './components/CustomListSection';
import ListPercentage from './components/ListPercentage';
import { isIOS, showErrorAlert } from '../../lib/methods/helpers';

interface IPushTroubleshootViewProps {
	navigation: StackNavigationProp<SettingsStackParamList, 'PushTroubleshootView'>;
}

const PushTroubleshootView = ({ navigation }: IPushTroubleshootViewProps): JSX.Element => {
	const deviceNotificationEnabled = false;
	const isCommunityEdition = true;
	const isPushGatewayConnected = true;
	const isCustomPushGateway = true;
	const consumptionPercentage = 50;

	const { colors } = useTheme();

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

	const alertWorkspaceConsumption = () => {
		Alert.alert(I18n.t('Push_consumption_alert_title'), I18n.t('Push_consumption_alert_description'));
	};

	const goToNotificationSettings = () => {
		if (isIOS) {
			Linking.openURL('app-settings:');
		}
	};

	const handleTestPushNotification = () => {
		// do nothing
	};

	let pushGatewayInfoDescription = 'Push_gateway_not_connected_description';
	let pushGatewayStatusColor = colors.userPresenceBusy;
	if (isPushGatewayConnected) {
		pushGatewayStatusColor = colors.userPresenceOnline;
		pushGatewayInfoDescription = 'Push_gateway_connected_description';
	}
	if (isPushGatewayConnected && isCustomPushGateway) {
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
				) : null}

				<CustomListSection
					title={isCustomPushGateway ? 'Custom_push_gateway_connection' : 'Push_gateway_connection'}
					statusColor={pushGatewayStatusColor}
				>
					<List.Separator />
					<List.Item
						title='Test_push_notification'
						disabled={!isPushGatewayConnected}
						onPress={handleTestPushNotification}
						testID='push-troubleshoot-view-push-gateway-connection'
					/>
					<List.Separator />
					<List.Info info={pushGatewayInfoDescription} />
				</CustomListSection>

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

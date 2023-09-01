import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';

import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { SettingsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';

interface IPushTroubleshootViewProps {
	navigation: StackNavigationProp<SettingsStackParamList, 'PushTroubleshootView'>;
}

const PushTroubleshootView = ({ navigation }: IPushTroubleshootViewProps): JSX.Element => {
	const { colors } = useTheme();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Push_Troubleshooting')
		});
	}, [navigation]);

	return (
		<SafeAreaView testID='push-troubleshoot-view'>
			<StatusBar />
			<List.Container testID='push-troubleshoot-view-list'>
				<List.Section title='Device_notification_settings'>
					<List.Separator />
					<List.Item
						title='Allow_push_notifications_for_rocket_chat'
						onPress={() => {}}
						testID='push-troubleshoot-view-allow-push-notifications'
					/>
					<List.Separator />
				</List.Section>

				<List.Section title='Community_edition_push_quota'>
					<List.Separator />
					<List.Item title='Workspace_consumption' onPress={() => {}} testID='push-troubleshoot-view-workspace-consumption' />
					<List.Separator />
					<List.Info info='Workspace_consumption_description' />
				</List.Section>

				<List.Section title='Push_gateway_connection'>
					<List.Separator />
					<List.Item title='Test_push_notification' onPress={() => {}} testID='push-troubleshoot-view-push-gateway-connection' />
					<List.Separator />
					<List.Info info='Push_gateway_connection_description' />
				</List.Section>

				<List.Section title='Notification_delay'>
					<List.Separator />
					<List.Item
						title='Documentation'
						onPress={() => {}}
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

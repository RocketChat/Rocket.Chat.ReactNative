import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { initTroubleshootingNotification } from '../../actions/troubleshootingNotification';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import { SettingsStackParamList } from '../../stacks/types';
import CommunityEditionPushQuota from './components/CommunityEditionPushQuota';
import DeviceNotificationSettings from './components/DeviceNotificationSettings';
import NotificationDelay from './components/NotificationDelay';
import PushGatewayConnection from './components/PushGatewayConnection';

interface IPushTroubleshootViewProps {
	navigation: StackNavigationProp<SettingsStackParamList, 'PushTroubleshootView'>;
}

const PushTroubleshootView = ({ navigation }: IPushTroubleshootViewProps): JSX.Element => {
	const dispatch = useDispatch();
	const foreground = useAppSelector(state => state.app.foreground);

	useEffect(() => {
		if (foreground) {
			dispatch(initTroubleshootingNotification());
		}
	}, [dispatch, foreground]);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Push_Troubleshooting')
		});
	}, [navigation]);

	return (
		<SafeAreaView testID='push-troubleshoot-view'>
			<StatusBar />
			<List.Container testID='push-troubleshoot-view-list'>
				<DeviceNotificationSettings />
				<CommunityEditionPushQuota />
				<PushGatewayConnection />
				<NotificationDelay />
			</List.Container>
		</SafeAreaView>
	);
};

export default PushTroubleshootView;

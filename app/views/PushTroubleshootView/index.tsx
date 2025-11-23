import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { initTroubleshootingNotification } from '../../actions/troubleshootingNotification';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import { type SettingsStackParamList } from '../../stacks/types';
// import CommunityEditionPushQuota from './components/CommunityEditionPushQuota';
import DeviceNotificationSettings from './components/DeviceNotificationSettings';
import NotificationDelay from './components/NotificationDelay';
import PushGatewayConnection from './components/PushGatewayConnection';

interface IPushTroubleshootViewProps {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'PushTroubleshootView'>;
}

const PushTroubleshootView = ({ navigation }: IPushTroubleshootViewProps): JSX.Element => {
	const dispatch = useDispatch();

	useFocusEffect(
		useCallback(() => {
			dispatch(initTroubleshootingNotification());
		}, [dispatch])
	);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Push_Troubleshooting')
		});
	}, [navigation]);

	return (
		<SafeAreaView testID='push-troubleshoot-view'>
			<List.Container testID='push-troubleshoot-view-list'>
				<DeviceNotificationSettings />
				{/* <CommunityEditionPushQuota /> */}
				<PushGatewayConnection />
				<NotificationDelay />
			</List.Container>
		</SafeAreaView>
	);
};

export default PushTroubleshootView;

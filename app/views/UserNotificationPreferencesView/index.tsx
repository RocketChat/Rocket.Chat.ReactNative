import React, { useEffect, useLayoutEffect, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';

import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { INotificationPreferences } from '../../definitions';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import ListPicker from './ListPicker';
import log from '../../lib/methods/helpers/log';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { useUserPreferences } from '../../lib/methods';
import { NOTIFICATION_IN_APP_VIBRATION } from '../../lib/constants';
import Switch from '../../containers/Switch';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'UserNotificationPrefView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

const UserNotificationPreferencesView = () => {
	const [inAppVibration, setInAppVibration] = useUserPreferences<boolean>(NOTIFICATION_IN_APP_VIBRATION, true);
	const [preferences, setPreferences] = useState({} as INotificationPreferences);
	const [loading, setLoading] = useState(true);

	const navigation = useNavigation<TNavigation>();
	const { userId, isMasterDetail } = useAppSelector(state => ({
		userId: getUserSelector(state).id,
		isMasterDetail: state.app.isMasterDetail
	}));

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Notification_Preferences')
		});
	}, [navigation]);

	useEffect(() => {
		async function getPreferences() {
			try {
				const result = await Services.getUserPreferences(userId);
				if (result.success) {
					setLoading(false);
					setPreferences(result.preferences);
				}
			} catch (error) {
				setLoading(false);
				log(error);
			}
		}
		getPreferences();
	}, [userId]);

	const onValueChangePicker = async (param: { [key: string]: string }) => {
		const previousPreferences = preferences;
		try {
			setPreferences({ ...previousPreferences, ...param });
			const result = await Services.setUserPreferences(userId, param);
			if (!result.success) {
				setPreferences(previousPreferences);
			}
		} catch (error) {
			setPreferences(previousPreferences);
			log(error);
		}
	};

	const navigateToPushTroubleshootView = () => {
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'PushTroubleshootView' });
		} else {
			navigation.navigate('PushTroubleshootView');
		}
	};

	const toggleInAppVibration = () => {
		setInAppVibration(!inAppVibration);
	};

	return (
		<SafeAreaView testID='user-notification-preference-view'>
			<StatusBar />
			<List.Container>
				{loading ? (
					<ActivityIndicator />
				) : (
					<>
						<List.Section title='Desktop_Notifications'>
							<List.Separator />
							<ListPicker
								onChangeValue={onValueChangePicker}
								preference={'desktopNotifications'}
								title='Alert'
								testID='user-notification-preference-view-alert'
								value={preferences.desktopNotifications}
							/>
							<List.Separator />
							<List.Info info='Desktop_Alert_info' />
						</List.Section>

						<List.Section title='Push_Notifications'>
							<List.Separator />
							<ListPicker
								onChangeValue={onValueChangePicker}
								preference={'pushNotifications'}
								title='Alert'
								testID='user-notification-preference-view-push-notification'
								value={preferences.pushNotifications}
							/>
							<List.Separator />
							<List.Item
								title='Troubleshooting'
								onPress={navigateToPushTroubleshootView}
								testID='user-notification-preference-view-troubleshooting'
								showActionIndicator
							/>
							<List.Separator />
							<List.Info info='Push_Notifications_Alert_Info' />
						</List.Section>

						<List.Section title='In_app_message_notifications'>
							<List.Separator />
							<List.Item
								title='Vibrate'
								testID='user-notification-preference-view-in-app-vibration'
								right={() => <Switch value={inAppVibration} onValueChange={toggleInAppVibration} />}
							/>
							<List.Separator />
						</List.Section>

						<List.Section title='Email'>
							<List.Separator />
							<ListPicker
								onChangeValue={onValueChangePicker}
								preference={'emailNotificationMode'}
								title='Alert'
								testID='user-notification-preference-view-email-alert'
								value={preferences.emailNotificationMode}
							/>
							<List.Separator />
							<List.Info info='You_need_to_verifiy_your_email_address_to_get_notications' />
						</List.Section>
					</>
				)}
			</List.Container>
		</SafeAreaView>
	);
};

export default UserNotificationPreferencesView;

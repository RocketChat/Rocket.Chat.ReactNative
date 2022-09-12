import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

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

const UserNotificationPreferencesView = () => {
	const [preferences, setPreferences] = useState({} as INotificationPreferences);
	const [loading, setLoading] = useState(false);

	const navigation = useNavigation<StackNavigationProp<ProfileStackParamList, 'UserNotificationPrefView'>>();
	const userId = useAppSelector(state => getUserSelector(state).id);

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
					setLoading(true);
					setPreferences(result.preferences);
				}
			} catch (error) {
				log(error);
			}
		}
		getPreferences();
	}, [userId]);

	const onValueChangePicker = async (param: { [key: string]: string }, onError: () => void) => {
		try {
			const result = await Services.setUserPreferences(userId, param);
			if (result.success) {
				const {
					user: { settings }
				} = result;
				setPreferences(settings.preferences);
			}
		} catch (error) {
			log(error);
			onError();
		}
	};

	return (
		<SafeAreaView testID='user-notification-preference-view'>
			<StatusBar />
			<List.Container>
				{loading ? (
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
							<List.Info info='Push_Notifications_Alert_Info' />
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
				) : (
					<ActivityIndicator />
				)}
			</List.Container>
		</SafeAreaView>
	);
};

export default UserNotificationPreferencesView;

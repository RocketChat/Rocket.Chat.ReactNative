import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import { compareServerVersion } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import ListPicker from './ListPicker';
import Switch from '../../containers/Switch';

interface IUserPreferencesViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const { enableMessageParserEarlyAdoption, id, alsoSendThreadToChannel } = useAppSelector(state => getUserSelector(state));
	const serverVersion = useAppSelector(state => state.server.version);
	const dispatch = useDispatch();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, [navigation]);

	const navigateToScreen = (screen: keyof ProfileStackParamList) => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		// @ts-ignore
		navigation.navigate(screen);
	};

	const toggleMessageParser = async (value: boolean) => {
		try {
			dispatch(setUser({ enableMessageParserEarlyAdoption: value }));
			await Services.saveUserPreferences({ id, enableMessageParserEarlyAdoption: value });
		} catch (e) {
			log(e);
		}
	};

	const setAlsoSendThreadToChannel = async (param: { [key: string]: string }, onError: () => void) => {
		try {
			await Services.saveUserPreferences(param);
			dispatch(setUser(param));
		} catch (e) {
			log(e);
			onError();
		}
	};

	return (
		<SafeAreaView testID='preferences-view'>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Notifications'
						onPress={() => navigateToScreen('UserNotificationPrefView')}
						showActionIndicator
						testID='preferences-view-notifications'
					/>
					<List.Separator />
				</List.Section>
				{compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? (
					<List.Section>
						<List.Separator />
						<List.Item
							title='Enable_Message_Parser'
							testID='preferences-view-enable-message-parser'
							right={() => <Switch value={enableMessageParserEarlyAdoption} onValueChange={toggleMessageParser} />}
						/>
						<List.Separator />
					</List.Section>
				) : null}
				{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0') ? (
					<List.Section title='Also_send_thread_message_to_channel_behavior'>
						<List.Separator />
						<ListPicker
							onChangeValue={setAlsoSendThreadToChannel}
							preference='alsoSendThreadToChannel'
							value={alsoSendThreadToChannel}
							title='Message_composer_Send_to_channel'
							testID='preferences-view-enable-message-parser'
						/>
						<List.Separator />
						<List.Info info='Accounts_Default_User_Preferences_alsoSendThreadToChannel_Description' />
					</List.Section>
				) : null}
			</List.Container>
		</SafeAreaView>
	);
};

export default UserPreferencesView;

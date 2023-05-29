import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Switch } from 'react-native';
import { useDispatch } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../lib/methods/helpers/log';
import { compareServerVersion } from '../../lib/methods/helpers';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { SWITCH_TRACK_COLOR } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import { useAppSelector } from '../../lib/hooks';
import ListPicker from './ListPicker';

interface IUserPreferencesViewProps {
	navigation: StackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
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

	const navigateToScreen = () => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		navigation.navigate('UserNotificationPrefView');
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

	const renderMessageParserSwitch = (value: boolean) => (
		<Switch value={value} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleMessageParser} />
	);

	return (
		<SafeAreaView testID='preferences-view'>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Notifications'
						onPress={() => navigateToScreen()}
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
							right={() => renderMessageParserSwitch(enableMessageParserEarlyAdoption)}
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
							title='Messagebox_Send_to_channel'
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

import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { setUser } from '../../actions/login';
import I18n from '../../i18n';
import log, { logEvent, events } from '../../utils/log';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';
import RocketChat from '../../lib/rocketchat';
import { ProfileStackParamList } from '../../stacks/types';
import { IApplicationState } from '../../definitions';

interface IUserPreferencesViewProps {
	navigation: StackNavigationProp<ProfileStackParamList, 'UserPreferencesView'>;
}

const UserPreferencesView = ({ navigation }: IUserPreferencesViewProps): JSX.Element => {
	const { enableMessageParserEarlyAdoption, id } = useSelector((state: IApplicationState) => getUserSelector(state));
	const dispatch = useDispatch();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, []);

	const navigateToScreen = (screen: keyof ProfileStackParamList) => {
		logEvent(events.UP_GO_USER_NOTIFICATION_PREF);
		navigation.navigate(screen);
	};

	const toggleMessageParser = async (value: boolean) => {
		try {
			dispatch(setUser({ enableMessageParserEarlyAdoption: value }));
			await RocketChat.saveUserPreferences({ id, enableMessageParserEarlyAdoption: value });
		} catch (e) {
			log(e);
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
						onPress={() => navigateToScreen('UserNotificationPrefView')}
						showActionIndicator
						testID='preferences-view-notifications'
					/>
					<List.Separator />
				</List.Section>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Enable_Message_Parser'
						testID='preferences-view-enable-message-parser'
						right={() => renderMessageParserSwitch(enableMessageParserEarlyAdoption)}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default UserPreferencesView;

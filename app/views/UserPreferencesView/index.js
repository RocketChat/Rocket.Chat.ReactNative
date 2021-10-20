import React, { useEffect, useState } from 'react';
import { Switch } from 'react-native';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import I18n from '../../i18n';
import log, { logEvent, events } from '../../utils/log';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';
import RocketChat from '../../lib/rocketchat';

const UserPreferencesView = ({ navigation }) => {
	const user = useSelector(state => getUserSelector(state));
	const [enableParser, setEnableParser] = useState(user.enableMessageParserEarlyAdoption);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Preferences')
		});
	}, []);

	const navigateToScreen = (screen, params) => {
		logEvent(events[`SE_GO_${screen.replace('View', '').toUpperCase()}`]);
		navigation.navigate(screen, params);
	};

	const toggleMessageParser = async value => {
		try {
			await RocketChat.saveUserPreferences({ id: user.id, enableMessageParserEarlyAdoption: value });
			setEnableParser(value);
		} catch (e) {
			log(e);
		}
	};

	const renderMessageParserSwitch = () => (
		<Switch value={enableParser} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleMessageParser} />
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
						right={() => renderMessageParserSwitch()}
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

UserPreferencesView.propTypes = {
	navigation: PropTypes.object
};

export default UserPreferencesView;

import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

import I18n from '../../i18n';
import { events, logEvent } from '../../utils/log';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';

interface IUserPreferencesView {
	navigation: StackNavigationProp<any, 'UserPreferencesView'>;
}

class UserPreferencesView extends React.Component<IUserPreferencesView, any> {
	static navigationOptions = () => ({
		title: I18n.t('Preferences')
	});

	navigateToScreen = (screen: string) => {
		logEvent(events.SE_GO_USER_NOTIFICATION_PREF);
		const { navigation } = this.props;
		navigation.navigate(screen);
	};

	render() {
		return (
			<SafeAreaView testID='preferences-view'>
				<StatusBar />
				<List.Container>
					<List.Section>
						<List.Separator />
						<List.Item
							title='Notifications'
							onPress={() => this.navigateToScreen('UserNotificationPrefView')}
							showActionIndicator
							testID='preferences-view-notifications'
						/>
						<List.Separator />
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

export default UserPreferencesView;

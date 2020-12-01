import React from 'react';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import {
	logEvent, events
} from '../../utils/log';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';

class UserPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Preferences')
	});

	static propTypes = {
		navigation: PropTypes.object
	}

	navigateToScreen = (screen, params) => {
		logEvent(events[`SE_GO_${ screen.replace('View', '').toUpperCase() }`]);
		const { navigation } = this.props;
		navigation.navigate(screen, params);
	}

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

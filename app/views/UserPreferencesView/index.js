import React from 'react';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import {
	logEvent, events
} from '../../utils/log';
import Separator from '../../containers/Separator';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import * as List from '../../containers/List';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import { withTheme } from '../../theme';

class UserPreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Preferences')
	});

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	renderDisclosure = () => {
		const { theme } = this.props;
		return <DisclosureImage theme={theme} />;
	}

	navigateToScreen = (screen, params) => {
		logEvent(events[`SE_GO_${ screen.replace('View', '').toUpperCase() }`]);
		const { navigation } = this.props;
		navigation.navigate(screen, params);
	}

	render() {
		const { theme } = this.props;

		return (
			<SafeAreaView testID='preferences-view'>
				<StatusBar />
				<List.Container>
					<List.Section>
						<Separator theme={theme} />
						<List.Item
							title={I18n.t('Notifications')}
							onPress={() => this.navigateToScreen('UserNotificationPrefView')}
							showActionIndicator
							testID='preferences-view-notifications'
						/>
						<Separator theme={theme} />
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

export default withTheme(UserPreferencesView);

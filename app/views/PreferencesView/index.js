import React from 'react';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import {
	logEvent, events
} from '../../utils/log';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import Separator from '../../containers/Separator';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import { withTheme } from '../../theme';

class PreferencesView extends React.Component {
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
			<SafeAreaView testID='preferences-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={{ paddingVertical: 36 }}
					showsVerticalScrollIndicator={false}
					testID='preferences-view-list'
				>
					<ListItem
						title={I18n.t('Notifications')}
						onPress={() => this.navigateToScreen('UserNotificationPrefView')}
						showActionIndicator
						testID='preferences-view-notifications'
						right={this.renderDisclosure}
						theme={theme}
					/>
					<Separator theme={theme} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

export default withTheme(PreferencesView);

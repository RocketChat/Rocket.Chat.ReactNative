import React from 'react';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

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
import { getUserSelector } from '../../selectors/login';

class PreferencesView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Preferences')
	});

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string
		})
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
		const { theme, user } = this.props;

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
						onPress={() => this.navigateToScreen('UserNotificationPrefView', { user })}
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

const mapStateToProps = state => ({
	user: getUserSelector(state)
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(PreferencesView));

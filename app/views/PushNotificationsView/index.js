import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, View, ScrollView, AsyncStorage, Switch, Text
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { themedHeader } from '../../utils/navigation';
import { withTheme } from '../../theme';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import Separator from '../../containers/Separator';
import ListItem from '../../containers/ListItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

import { initializePushNotifications } from '../../notifications/push';
import { toggleSocketNotifications as toggleSocketNotificationsAction } from '../../actions/socketNotifications';
import { SOCKET_NOTIFICATIONS_KEY } from '../../lib/rocketchat';

const styles = StyleSheet.create({
	list: {
		paddingBottom: 18
	},
	info: {
		paddingTop: 25,
		paddingBottom: 18,
		paddingHorizontal: 16
	},
	infoText: {
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

class PushNotificationsView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Socket_notifications'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		theme: PropTypes.string,
		allowSocketNotifications: PropTypes.bool,
		toggleSocketNotifications: PropTypes.func
	}

	constructor(props) {
		super(props);
	}

	renderSocketNotificationsSwitch = () => {
		const { allowSocketNotifications } = this.props;
		return (
			<Switch
				value={allowSocketNotifications}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleSocketNotifications}
			/>
		);
	}

	toggleSocketNotifications = async(value) => {
		RNUserDefaults.set(SOCKET_NOTIFICATIONS_KEY, JSON.stringify(value))
		const { toggleSocketNotifications } = this.props;
		toggleSocketNotifications(value);
		initializePushNotifications();
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={[sharedStyles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}
				testID='push-notifications-view'
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar theme={theme} />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.listPadding}
					showsVerticalScrollIndicator={false}
					testID='push-notifications-view-list'
				>

					<Separator theme={theme} />
					<ListItem
						title={I18n.t('Enable_socket_notifications')}
						testID='push-notifications-view-socket-notifications'
						right={() => this.renderSocketNotificationsSwitch()}
						theme={theme}
					/>
					<Separator theme={theme} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	allowSocketNotifications: state.socketNotifications.allowSocketNotifications
});

const mapDispatchToProps = dispatch => ({
	toggleSocketNotifications: params => dispatch(toggleSocketNotificationsAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(PushNotificationsView));

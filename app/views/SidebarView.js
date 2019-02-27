import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View, StyleSheet, FlatList, LayoutAnimation, SafeAreaView, Image
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import equal from 'deep-equal';

import Navigation from '../lib/Navigation';
import { logout as logoutAction } from '../actions/login';
import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch';
import { STATUS_COLORS } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { getReadableVersion, isIOS, isAndroid } from '../utils/deviceInfo';
import Icons from '../lib/Icons';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemLeft: {
		marginHorizontal: 10,
		width: 30,
		alignItems: 'center'
	},
	itemCenter: {
		flex: 1
	},
	itemText: {
		marginVertical: 16,
		fontWeight: 'bold',
		color: '#292E35'
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#ddd',
		marginVertical: 4
	},
	header: {
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	headerUsername: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginHorizontal: 10
	},
	status: {
		borderRadius: 12,
		width: 12,
		height: 12,
		marginRight: 5
	},
	currentServerText: {
		fontWeight: 'bold'
	},
	version: {
		marginHorizontal: 5,
		marginBottom: 5,
		fontWeight: '600',
		color: '#292E35',
		fontSize: 13
	},
	disclosureContainer: {
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	}
});
const keyExtractor = item => item.id;

@connect(state => ({
	Site_Name: state.settings.Site_Name,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	logout: () => dispatch(logoutAction())
}))
export default class Sidebar extends Component {
	static options() {
		return {
			topBar: {
				leftButtons: [{
					id: 'cancel',
					icon: isAndroid ? Icons.getSource('close', false) : undefined,
					systemItem: 'cancel'
				}]
			}
		};
	}

	static propTypes = {
		baseUrl: PropTypes.string,
		componentId: PropTypes.string,
		Site_Name: PropTypes.string.isRequired,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false,
			status: []
		};
		Navigation.events().bindComponent(this);
	}

	componentDidMount() {
		this.setStatus();
	}

	componentWillReceiveProps(nextProps) {
		const { user } = this.props;
		if (nextProps.user && user && user.language !== nextProps.user.language) {
			this.setStatus();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { status, showStatus } = this.state;
		const { Site_Name, user, baseUrl } = this.props;
		if (nextState.showStatus !== showStatus) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.baseUrl !== baseUrl) {
			return true;
		}
		if (nextProps.user && user) {
			if (nextProps.user.language !== user.language) {
				return true;
			}
			if (nextProps.user.status !== user.status) {
				return true;
			}
			if (nextProps.user.username !== user.username) {
				return true;
			}
		}
		if (!equal(nextState.status, status)) {
			return true;
		}
		return false;
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'cancel') {
			const { componentId } = this.props;
			Navigation.dismissModal(componentId);
		}
	}

	setStatus = () => {
		this.setState({
			status: [{
				id: 'online',
				name: I18n.t('Online')
			}, {
				id: 'busy',
				name: I18n.t('Busy')
			}, {
				id: 'away',
				name: I18n.t('Away')
			}, {
				id: 'offline',
				name: I18n.t('Invisible')
			}]
		});
	}

	toggleStatus = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState(prevState => ({ showStatus: !prevState.showStatus }));
	}

	sidebarNavigate = (route) => {
		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				name: route
			}
		});
	}

	logout = () => {
		const { componentId, logout } = this.props;
		Navigation.dismissModal(componentId);
		logout();
	}

	renderSeparator = key => <View key={key} style={styles.separator} />;

	renderItem = ({
		text, left, onPress, testID, disclosure
	}) => (
		<Touch
			key={text}
			onPress={onPress}
			underlayColor='rgba(255, 255, 255, 0.5)'
			activeOpacity={0.3}
			testID={testID}
		>
			<View style={styles.item}>
				<View style={styles.itemLeft}>
					{left}
				</View>
				<View style={styles.itemCenter}>
					<Text style={styles.itemText}>
						{text}
					</Text>
				</View>
				{disclosure ? this.renderDisclosure() : null}
			</View>
		</Touch>
	)

	renderStatusItem = ({ item }) => {
		const { user } = this.props;
		return (
			this.renderItem({
				text: item.name,
				left: <View style={[styles.status, { backgroundColor: STATUS_COLORS[item.id] }]} />,
				current: user.status === item.id,
				onPress: () => {
					this.toggleStatus();
					if (user.status !== item.id) {
						try {
							RocketChat.setUserPresenceDefaultStatus(item.id);
						} catch (e) {
							log('setUserPresenceDefaultStatus', e);
						}
					}
				}
			})
		);
	}

	// Remove it after https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/643
	renderDisclosure = () => {
		if (isIOS) {
			return (
				<View style={styles.disclosureContainer}>
					<Image source={{ uri: 'disclosure_indicator' }} style={styles.disclosureIndicator} />
				</View>
			);
		}
	}

	renderNavigation = () => (
		[
			this.renderItem({
				text: I18n.t('Profile'),
				left: <Icon name='person' size={20} />,
				onPress: () => this.sidebarNavigate('ProfileView'),
				testID: 'sidebar-profile',
				disclosure: true
			}),
			this.renderItem({
				text: I18n.t('Settings'),
				left: <Icon name='settings' size={20} />,
				onPress: () => this.sidebarNavigate('SettingsView'),
				testID: 'sidebar-settings',
				disclosure: true
			}),
			this.renderSeparator('separator-logout'),
			this.renderItem({
				text: I18n.t('Logout'),
				left: <Icon name='exit-to-app' size={20} />,
				onPress: () => this.logout(),
				testID: 'sidebar-logout'
			})
		]
	)

	renderStatus = () => {
		const { status } = this.state;
		const { user } = this.props;
		return (
			<FlatList
				key='status-list'
				data={status}
				extraData={user}
				renderItem={this.renderStatusItem}
				keyExtractor={keyExtractor}
			/>
		);
	}

	render() {
		const { showStatus } = this.state;
		const { user, Site_Name, baseUrl } = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' style={styles.container}>
				<ScrollView style={styles.container} {...scrollPersistTaps}>
					<Touch
						onPress={() => this.toggleStatus()}
						underlayColor='rgba(255, 255, 255, 0.5)'
						activeOpacity={0.3}
						testID='sidebar-toggle-status'
					>
						<View style={styles.header}>
							<Avatar
								text={user.username}
								size={30}
								style={styles.avatar}
								baseUrl={baseUrl}
								user={user}
							/>
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Status style={styles.status} id={user.id} />
									<Text numberOfLines={1}>{user.username}</Text>
								</View>
								<Text style={styles.currentServerText} numberOfLines={1}>{Site_Name}</Text>
							</View>
							<Icon
								name={showStatus ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
								size={30}
								style={{ paddingHorizontal: 10 }}
							/>
						</View>
					</Touch>

					{this.renderSeparator('separator-header')}

					{!showStatus ? this.renderNavigation() : null}
					{showStatus ? this.renderStatus() : null}
				</ScrollView>
				<Text style={styles.version}>
					{getReadableVersion}
				</Text>
			</SafeAreaView>
		);
	}
}

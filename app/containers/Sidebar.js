import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View, StyleSheet, FlatList, LayoutAnimation, SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Navigation } from 'react-native-navigation';

import { appStart as appStartAction, setStackRoot as setStackRootAction } from '../actions';
import { logout as logoutAction } from '../actions/login';
import Avatar from './Avatar';
import Status from './status';
import Touch from '../utils/touch';
import { STATUS_COLORS } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import DeviceInfo from '../utils/deviceInfo';
import Drawer from '../Drawer';

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
	itemText: {
		marginVertical: 16,
		fontWeight: 'bold',
		color: '#292E35'
	},
	itemSelected: {
		backgroundColor: '#F7F8FA'
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
	}
});
const keyExtractor = item => item.id;

@connect(state => ({
	Site_Name: state.settings.Site_Name,
	stackRoot: state.app.stackRoot,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	logout: () => dispatch(logoutAction()),
	appStart: () => dispatch(appStartAction('outside')),
	setStackRoot: stackRoot => dispatch(setStackRootAction(stackRoot))
}))
export default class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		componentId: PropTypes.string,
		Site_Name: PropTypes.string.isRequired,
		stackRoot: PropTypes.string.isRequired,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		appStart: PropTypes.func,
		setStackRoot: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false
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

	handleChangeStack = (event) => {
		const { stack } = event;
		this.setStack(stack);
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'cancel') {
			const { componentId } = this.props;
			Navigation.dismissModal(componentId);
		}
	}

	setStatus = () => {
		setTimeout(() => {
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
		});
	}

	setStack = async(stack) => {
		const { stackRoot, setStackRoot } = this.props;
		if (stackRoot !== stack) {
			await Navigation.setStackRoot('AppRoot', {
				component: {
					id: stack,
					name: stack
				}
			});
			setStackRoot(stack);
		}
	}

	closeDrawer = () => {
		Drawer.toggle();
	}

	toggleStatus = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState(prevState => ({ showStatus: !prevState.showStatus }));
	}

	sidebarNavigate = (stack) => {
		this.closeDrawer();
		this.setStack(stack);
	}

	renderSeparator = key => <View key={key} style={styles.separator} />;

	renderItem = ({
		text, left, onPress, testID, current
	}) => (
		<Touch
			key={text}
			onPress={onPress}
			underlayColor='rgba(255, 255, 255, 0.5)'
			activeOpacity={0.3}
			testID={testID}
		>
			<View style={[styles.item, current && styles.itemSelected]}>
				<View style={styles.itemLeft}>
					{left}
				</View>
				<Text style={styles.itemText}>
					{text}
				</Text>
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
					this.closeDrawer();
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

	renderNavigation = () => {
		const { stackRoot } = this.props;
		const { logout } = this.props;
		return (
			[
				this.renderItem({
					text: I18n.t('Chats'),
					left: <Icon name='chat-bubble' size={20} />,
					onPress: () => this.sidebarNavigate('RoomsListView'),
					testID: 'sidebar-chats',
					current: stackRoot === 'RoomsListView'
				}),
				this.renderItem({
					text: I18n.t('Profile'),
					left: <Icon name='person' size={20} />,
					onPress: () => this.sidebarNavigate('ProfileView'),
					testID: 'sidebar-profile',
					current: stackRoot === 'ProfileView'
				}),
				this.renderItem({
					text: I18n.t('Settings'),
					left: <Icon name='settings' size={20} />,
					onPress: () => this.sidebarNavigate('SettingsView'),
					testID: 'sidebar-settings',
					current: stackRoot === 'SettingsView'
				}),
				this.renderSeparator('separator-logout'),
				this.renderItem({
					text: I18n.t('Logout'),
					left: <Icon name='exit-to-app' size={20} />,
					onPress: () => logout(),
					testID: 'sidebar-logout'
				})
			]
		);
	}

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
			<SafeAreaView testID='sidebar' style={styles.container}>
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
					{DeviceInfo.getReadableVersion()}
				</Text>
			</SafeAreaView>
		);
	}
}

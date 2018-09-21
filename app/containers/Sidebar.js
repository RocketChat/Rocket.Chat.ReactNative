import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View, StyleSheet, FlatList, LayoutAnimation, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { appStart } from '../actions';
import { logout } from '../actions/login';
import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch';
import { STATUS_COLORS } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import { NavigationActions } from '../Navigation';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import DeviceInfo from '../utils/deviceInfo';

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
	server: state.server.server,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	logout: () => dispatch(logout()),
	appStart: () => dispatch(appStart('outside'))
}))
export default class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigator: PropTypes.object,
		server: PropTypes.string.isRequired,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		appStart: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false
		};
	}

	componentDidMount() {
		this.setStatus();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.user && this.props.user && this.props.user.language !== nextProps.user.language) {
			this.setStatus();
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

	closeDrawer = () => {
		this.props.navigator.toggleDrawer({
			side: 'left',
			animated: true,
			to: 'close'
		});
	}

	toggleStatus = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState({ showStatus: !this.state.showStatus });
	}

	sidebarNavigate = (screen, title) => {
		this.closeDrawer();
		NavigationActions.resetTo({ screen, title });
	}

	renderSeparator = key => <View key={key} style={styles.separator} />;

	renderItem = ({
		text, left, onPress, testID
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
				<Text style={styles.itemText}>
					{text}
				</Text>
			</View>
		</Touch>
	)

	renderStatusItem = ({ item }) => (
		this.renderItem({
			text: item.name,
			left: <View style={[styles.status, { backgroundColor: STATUS_COLORS[item.id] }]} />,
			selected: this.props.user.status === item.id,
			onPress: () => {
				this.closeDrawer();
				this.toggleStatus();
				if (this.props.user.status !== item.id) {
					try {
						RocketChat.setUserPresenceDefaultStatus(item.id);
					} catch (e) {
						log('setUserPresenceDefaultStatus', e);
					}
				}
			}
		})
	)

	renderNavigation = () => (
		[
			this.renderItem({
				text: I18n.t('Chats'),
				left: <Icon name='chat-bubble' size={20} />,
				onPress: () => this.sidebarNavigate('RoomsListView', I18n.t('Messages')),
				testID: 'sidebar-chats'
			}),
			this.renderItem({
				text: I18n.t('Profile'),
				left: <Icon name='person' size={20} />,
				onPress: () => this.sidebarNavigate('ProfileView', I18n.t('Profile')),
				testID: 'sidebar-profile'
			}),
			this.renderItem({
				text: I18n.t('Settings'),
				left: <Icon name='settings' size={20} />,
				onPress: () => this.sidebarNavigate('SettingsView', I18n.t('Settings')),
				testID: 'sidebar-settings'
			}),
			this.renderSeparator('separator-logout'),
			this.renderItem({
				text: I18n.t('Logout'),
				left: <Icon name='exit-to-app' size={20} />,
				onPress: () => this.props.logout(),
				testID: 'sidebar-logout'
			})
		]
	)

	renderStatus = () => (
		<FlatList
			key='status-list'
			data={this.state.status}
			extraData={this.props.user}
			renderItem={this.renderStatusItem}
			keyExtractor={keyExtractor}
		/>
	)

	render() {
		const { user, server, baseUrl } = this.props;
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
								<Text style={styles.currentServerText} numberOfLines={1}>{server}</Text>
							</View>
							<Icon
								name={this.state.showStatus ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
								size={30}
								style={{ paddingHorizontal: 10 }}
							/>
						</View>
					</Touch>

					{this.renderSeparator('separator-header')}

					{!this.state.showStatus ? this.renderNavigation() : null}
					{this.state.showStatus ? this.renderStatus() : null}
				</ScrollView>
				<Text style={styles.version}>
					{DeviceInfo.getReadableVersion()}
				</Text>
			</SafeAreaView>
		);
	}
}

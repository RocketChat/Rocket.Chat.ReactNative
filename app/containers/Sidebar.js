import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View, StyleSheet, FlatList, LayoutAnimation, AsyncStorage, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';

import database from '../lib/realm';
import { selectServer } from '../actions/server';
import { logout } from '../actions/login';
import { appStart } from '../actions';
import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch';
import { STATUS_COLORS } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import { NavigationActions } from '../Navigation';

const styles = StyleSheet.create({
	selected: {
		backgroundColor: 'rgba(0, 0, 0, .04)'
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
	itemLeftOpacity: {
		opacity: 0.62
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
	serverImage: {
		width: 24,
		height: 24,
		borderRadius: 4
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
	}
});
const keyExtractor = item => item.id;

@connect(state => ({
	server: state.server.server,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		server: state.login.user && state.login.user.server,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username
	}
}), dispatch => ({
	selectServer: server => dispatch(selectServer(server)),
	logout: () => dispatch(logout()),
	appStart: () => dispatch(appStart('outside'))
}))
export default class Sidebar extends Component {
	static propTypes = {
		navigator: PropTypes.object,
		server: PropTypes.string.isRequired,
		selectServer: PropTypes.func.isRequired,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		appStart: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			servers: [],
			showServers: false
		};
	}

	componentDidMount() {
		this.setState(this.getState());
		this.setStatus();
		database.databases.serversDB.addListener('change', this.updateState);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.user && this.props.user && this.props.user.language !== nextProps.user.language) {
			this.setStatus();
		}
	}

	componentWillUnmount() {
		database.databases.serversDB.removeListener('change', this.updateState);
	}

	onPressItem = (item) => {
		this.props.selectServer(item.id);
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

	getState = () => ({
		servers: database.databases.serversDB.objects('servers')
	})

	updateState = () => {
		this.setState(this.getState());
	}

	closeDrawer = () => {
		this.props.navigator.toggleDrawer({
			side: 'left',
			animated: true,
			to: 'close'
		});
	}

	toggleServers = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState({ showServers: !this.state.showServers });
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
				this.toggleServers();
				if (this.props.user.status !== item.id) {
					try {
						RocketChat.setUserPresenceDefaultStatus(item.id);
					} catch (e) {
						log('onPressModalButton', e);
					}
				}
			}
		})
	)

	renderServer = ({ item }) => (
		this.renderItem({
			text: item.id,
			left: <FastImage
				style={styles.serverImage}
				source={{ uri: encodeURI(`${ item.id }/assets/favicon_32.png`) }}
			/>,
			selected: this.props.server === item.id,
			onPress: async() => {
				this.closeDrawer();
				this.toggleServers();
				if (this.props.server !== item.id) {
					this.props.selectServer(item.id);
					const token = await AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ item.id }`);
					if (!token) {
						this.props.appStart();
					}
				}
			},
			testID: `sidebar-${ item.id }`
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

	renderServers = () => (
		[
			<FlatList
				key='status-list'
				data={this.state.status}
				extraData={this.props.user}
				renderItem={this.renderStatusItem}
				keyExtractor={keyExtractor}
			/>,
			this.renderSeparator('separator-status'),
			<FlatList
				key='servers-list'
				data={this.state.servers}
				extraData={this.props.server}
				renderItem={this.renderServer}
				keyExtractor={keyExtractor}
			/>,
			this.renderSeparator('separator-add-server'),
			this.renderItem({
				text: I18n.t('Add_Server'),
				left: <Icon
					name='add'
					size={20}
				/>,
				onPress: () => {
					this.closeDrawer();
					this.toggleServers();
					NavigationActions.push({
						screen: 'NewServerView',
						title: I18n.t('Add_Server')
					});
				},
				testID: 'sidebar-add-server'
			})
		]
	)

	render() {
		const { user, server } = this.props;
		if (!user) {
			return null;
		}
		return (
			<ScrollView style={{ backgroundColor: '#fff' }}>
				<SafeAreaView testID='sidebar'>
					<Touch
						onPress={() => this.toggleServers()}
						underlayColor='rgba(255, 255, 255, 0.5)'
						activeOpacity={0.3}
						testID='sidebar-toggle-server'
					>
						<View style={styles.header}>
							<Avatar
								text={user.username}
								size={30}
								style={styles.avatar}
							/>
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Status style={styles.status} id={user.id} />
									<Text>{user.username}</Text>
								</View>
								<Text style={styles.currentServerText}>{server}</Text>
							</View>
							<Icon
								name={this.state.showServers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
								size={30}
								style={{ paddingHorizontal: 10 }}
							/>
						</View>
					</Touch>

					{this.renderSeparator('separator-header')}

					{!this.state.showServers ? this.renderNavigation() : null}
					{this.state.showServers ? this.renderServers() : null}
				</SafeAreaView>
			</ScrollView>
		);
	}
}

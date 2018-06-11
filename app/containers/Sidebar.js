import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View, StyleSheet, FlatList, LayoutAnimation } from 'react-native';
import { connect } from 'react-redux';
import { DrawerActions, SafeAreaView } from 'react-navigation';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';

import database from '../lib/realm';
import { setServer } from '../actions/server';
import { logout } from '../actions/login';
import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch';
import { STATUS_COLORS } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';

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
	user: state.login.user
}), dispatch => ({
	selectServer: server => dispatch(setServer(server)),
	logout: () => dispatch(logout())
}))
export default class Sidebar extends Component {
	static propTypes = {
		server: PropTypes.string.isRequired,
		selectServer: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		logout: PropTypes.func.isRequired
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
		this.closeDrawer();
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
		this.props.navigation.dispatch(DrawerActions.closeDrawer());
	}

	toggleServers = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState({ showServers: !this.state.showServers });
	}

	isRouteFocused = (route) => {
		const { state } = this.props.navigation;
		const activeItemKey = state.routes[state.index] ? state.routes[state.index].key : null;
		return activeItemKey === route;
	}

	sidebarNavigate = (route) => {
		const { navigate } = this.props.navigation;
		if (!this.isRouteFocused(route)) {
			navigate(route);
		} else {
			this.closeDrawer();
		}
	}

	renderSeparator = key => <View key={key} style={styles.separator} />;

	renderItem = ({
		text, left, selected, onPress, testID
	}) => (
		<Touch
			key={text}
			onPress={onPress}
			underlayColor='rgba(255, 255, 255, 0.5)'
			activeOpacity={0.3}
			testID={testID}
		>
			<View style={[styles.item, selected && styles.selected]}>
				<View style={[styles.itemLeft, !selected && styles.itemLeftOpacity]}>
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
			onPress: () => {
				this.closeDrawer();
				this.toggleServers();
				if (this.props.server !== item.id) {
					this.props.selectServer(item.id);
					this.props.navigation.navigate('RoomsList');
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
				onPress: () => this.sidebarNavigate('Chats'),
				selected: this.isRouteFocused('Chats'),
				testID: 'sidebar-chats'
			}),
			this.renderItem({
				text: I18n.t('Profile'),
				left: <Icon name='person' size={20} />,
				onPress: () => this.sidebarNavigate('ProfileView'),
				selected: this.isRouteFocused('ProfileView'),
				testID: 'sidebar-profile'
			}),
			this.renderItem({
				text: I18n.t('Settings'),
				left: <Icon name='settings' size={20} />,
				onPress: () => this.sidebarNavigate('SettingsView'),
				selected: this.isRouteFocused('SettingsView'),
				testID: 'sidebar-settings'
			}),
			this.renderSeparator('separator-logout'),
			this.renderItem({
				text: I18n.t('Logout'),
				left: <Icon
					name='exit-to-app'
					size={20}
				/>,
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
					this.props.navigation.navigate('AddServer');
				},
				testID: 'sidebar-add-server'
			})
		]
	)

	render() {
		const { user, server } = this.props;
		return (
			<ScrollView>
				<SafeAreaView
					style={styles.container}
					forceInset={{ top: 'always', horizontal: 'never' }}
					testID='sidebar'
				>
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

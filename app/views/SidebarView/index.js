import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View, FlatList, LayoutAnimation, SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import { RectButton } from 'react-native-gesture-handler';

import { logout as logoutAction } from '../../actions/login';
import Avatar from '../../containers/Avatar';
import StatusContainer from '../../containers/Status';
import Status from '../../containers/Status/Status';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import SidebarItem from './SidebarItem';
import { COLOR_TEXT } from '../../constants/colors';
import database from '../../lib/realm';

const keyExtractor = item => item.id;

const Separator = React.memo(() => <View style={styles.separator} />);

const permissions = [
	'view-statistics',
	'view-room-administration',
	'view-user-administration',
	'view-privileged-setting'
];

@connect(state => ({
	Site_Name: state.settings.Site_Name,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token,
		roles: state.login.user && state.login.user.roles
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	logout: () => dispatch(logoutAction())
}))
export default class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		Site_Name: PropTypes.string.isRequired,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		activeItemKey: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false,
			status: []
		};
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
		const {
			Site_Name, user, baseUrl, activeItemKey
		} = this.props;
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
		if (nextProps.activeItemKey !== activeItemKey) {
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
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	logout = () => {
		const { logout } = this.props;
		logout();
	}

	canSeeAdminPanel() {
		const { user } = this.props;
		const { roles } = user;
		if	(roles) {
			const permissionsFiltered = database.objects('permissions')
				.filter(permission => permissions.includes(permission._id));
			return permissionsFiltered.reduce((result, permission) => (
				result || permission.roles.some(r => roles.includes(r))),
			false);
		}
		return false;
	}

	renderStatusItem = ({ item }) => {
		const { user } = this.props;
		return (
			<SidebarItem
				text={item.name}
				left={<Status style={styles.status} size={12} status={item.id} />}
				current={user.status === item.id}
				onPress={() => {
					this.toggleStatus();
					if (user.status !== item.id) {
						try {
							RocketChat.setUserPresenceDefaultStatus(item.id);
						} catch (e) {
							log('setUserPresenceDefaultStatus', e);
						}
					}
				}}
			/>
		);
	}

	renderNavigation = () => {
		const { activeItemKey } = this.props;
		return (
			<React.Fragment>
				<SidebarItem
					text={I18n.t('Chats')}
					left={<CustomIcon name='message' size={20} color={COLOR_TEXT} />}
					onPress={() => this.sidebarNavigate('RoomsListView')}
					testID='sidebar-chats'
					current={activeItemKey === 'ChatsStack'}
				/>
				<SidebarItem
					text={I18n.t('Profile')}
					left={<CustomIcon name='user' size={20} color={COLOR_TEXT} />}
					onPress={() => this.sidebarNavigate('ProfileView')}
					testID='sidebar-profile'
					current={activeItemKey === 'ProfileStack'}
				/>
				<SidebarItem
					text={I18n.t('Settings')}
					left={<CustomIcon name='cog' size={20} color={COLOR_TEXT} />}
					onPress={() => this.sidebarNavigate('SettingsView')}
					testID='sidebar-settings'
					current={activeItemKey === 'SettingsStack'}
				/>
				{this.canSeeAdminPanel() ? (
					<SidebarItem
						text={I18n.t('Admin_Panel')}
						left={<CustomIcon name='shield-alt' size={20} color={COLOR_TEXT} />}
						onPress={() => this.sidebarNavigate('AdminPanelView')}
						testID='sidebar-settings'
						current={activeItemKey === 'AdminPanelStack'}
					/>
				) : null}
				<Separator key='separator-logout' />
				<SidebarItem
					text={I18n.t('Logout')}
					left={<CustomIcon name='sign-out' size={20} color={COLOR_TEXT} />}
					onPress={this.logout}
					testID='sidebar-logout'
				/>
			</React.Fragment>
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
			<SafeAreaView testID='sidebar-view' style={styles.container}>
				<ScrollView style={styles.container} {...scrollPersistTaps}>
					<RectButton
						onPress={this.toggleStatus}
						underlayColor={COLOR_TEXT}
						activeOpacity={0.1}
						testID='sidebar-toggle-status'
						style={styles.header}
					>
						<Avatar
							text={user.username}
							size={30}
							style={styles.avatar}
							baseUrl={baseUrl}
							userId={user.id}
							token={user.token}
						/>
						<View style={styles.headerTextContainer}>
							<View style={styles.headerUsername}>
								<StatusContainer style={styles.status} size={12} id={user.id} />
								<Text numberOfLines={1} style={styles.username}>{user.username}</Text>
							</View>
							<Text style={styles.currentServerText} numberOfLines={1}>{Site_Name}</Text>
						</View>
						<CustomIcon name='arrow-down' size={20} style={[styles.headerIcon, showStatus && styles.inverted]} />
					</RectButton>

					<Separator key='separator-header' />

					{!showStatus ? this.renderNavigation() : null}
					{showStatus ? this.renderStatus() : null}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

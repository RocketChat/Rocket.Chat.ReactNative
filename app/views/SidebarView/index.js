import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View, TouchableWithoutFeedback
} from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import isEqual from 'react-fast-compare';

import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status/Status';
import log, { logEvent, events } from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import SidebarItem from './SidebarItem';
import { themes } from '../../constants/colors';
import database from '../../lib/database';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from '../../lib/Navigation';

const Separator = React.memo(({ theme }) => <View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />);
Separator.propTypes = {
	theme: PropTypes.string
};

const permissions = [
	'view-statistics',
	'view-room-administration',
	'view-user-administration',
	'view-privileged-setting'
];

class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		Site_Name: PropTypes.string.isRequired,
		user: PropTypes.object,
		state: PropTypes.string,
		theme: PropTypes.string,
		loadingServer: PropTypes.bool,
		useRealName: PropTypes.bool,
		allowStatusMessage: PropTypes.bool,
		isMasterDetail: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false,
			isAdmin: false
		};
	}

	componentDidMount() {
		this.setIsAdmin();
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { loadingServer } = this.props;
		if (loadingServer && nextProps.loadingServer !== loadingServer) {
			this.setIsAdmin();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { showStatus, isAdmin } = this.state;
		const {
			Site_Name, user, baseUrl, state, isMasterDetail, useRealName, theme
		} = this.props;
		// Drawer navigation state
		if (state?.index !== nextProps.state?.index) {
			return true;
		}
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
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!isEqual(nextProps.user, user)) {
			return true;
		}
		if (nextProps.isMasterDetail !== isMasterDetail) {
			return true;
		}
		if (nextProps.useRealName !== useRealName) {
			return true;
		}
		if (nextState.isAdmin !== isAdmin) {
			return true;
		}
		return false;
	}

	async setIsAdmin() {
		const db = database.active;
		const { user } = this.props;
		const { roles } = user;
		try {
			if	(roles) {
				const permissionsCollection = db.collections.get('permissions');
				const permissionsFiltered = await permissionsCollection.query(Q.where('id', Q.oneOf(permissions))).fetch();
				const isAdmin = permissionsFiltered.reduce((result, permission) => (
					result || permission.roles.some(r => roles.indexOf(r) !== -1)),
				false);
				this.setState({ isAdmin });
			}
		} catch (e) {
			log(e);
		}
	}

	sidebarNavigate = (route) => {
		logEvent(events[`SIDEBAR_GO_${ route.replace('StackNavigator', '').replace('View', '').toUpperCase() }`]);
		Navigation.navigate(route);
	}

	get currentItemKey() {
		const { state } = this.props;
		return state?.routeNames[state?.index];
	}

	onPressUser = () => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			return;
		}
		navigation.closeDrawer();
	}

	renderAdmin = () => {
		const { isAdmin } = this.state;
		const { theme, isMasterDetail } = this.props;
		if (!isAdmin) {
			return null;
		}
		const routeName = isMasterDetail ? 'AdminPanelView' : 'AdminPanelStackNavigator';
		return (
			<>
				<Separator theme={theme} />
				<SidebarItem
					text={I18n.t('Admin_Panel')}
					left={<CustomIcon name='settings' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate(routeName)}
					testID='sidebar-settings'
					current={this.currentItemKey === routeName}
				/>
			</>
		);
	}

	renderNavigation = () => {
		const { theme } = this.props;
		return (
			<>
				<SidebarItem
					text={I18n.t('Chats')}
					left={<CustomIcon name='message' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('ChatsStackNavigator')}
					testID='sidebar-chats'
					current={this.currentItemKey === 'ChatsStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Profile')}
					left={<CustomIcon name='user' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('ProfileStackNavigator')}
					testID='sidebar-profile'
					current={this.currentItemKey === 'ProfileStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Settings')}
					left={<CustomIcon name='administration' size={20} color={themes[theme].titleText} />}
					onPress={() => this.sidebarNavigate('SettingsStackNavigator')}
					testID='sidebar-settings'
					current={this.currentItemKey === 'SettingsStackNavigator'}
				/>
				{this.renderAdmin()}
			</>
		);
	}

	renderCustomStatus = () => {
		const { user, theme } = this.props;
		return (
			<SidebarItem
				text={user.statusText || I18n.t('Edit_Status')}
				left={<Status style={styles.status} size={12} status={user && user.status} />}
				right={<CustomIcon name='edit' size={20} color={themes[theme].titleText} />}
				onPress={() => this.sidebarNavigate('StatusView')}
				testID='sidebar-custom-status'
			/>
		);
	}

	render() {
		const {
			user, Site_Name, baseUrl, useRealName, allowStatusMessage, isMasterDetail, theme
		} = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' style={{ backgroundColor: themes[theme].focusedBackground }} vertical={isMasterDetail}>
				<ScrollView
					style={[
						styles.container,
						{
							backgroundColor: isMasterDetail
								? themes[theme].backgroundColor
								: themes[theme].focusedBackground
						}
					]}
					{...scrollPersistTaps}
				>
					<TouchableWithoutFeedback onPress={this.onPressUser} testID='sidebar-close-drawer'>
						<View style={styles.header} theme={theme}>
							<Avatar
								text={user.username}
								style={styles.avatar}
								size={30}
							/>
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Text numberOfLines={1} style={[styles.username, { color: themes[theme].titleText }]}>{useRealName ? user.name : user.username}</Text>
								</View>
								<Text
									style={[styles.currentServerText, { color: themes[theme].titleText }]}
									numberOfLines={1}
									accessibilityLabel={`Connected to ${ baseUrl }`}
								>{Site_Name}
								</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>

					<Separator theme={theme} />

					{allowStatusMessage ? this.renderCustomStatus() : null}
					{!isMasterDetail ? (
						<>
							<Separator theme={theme} />
							{this.renderNavigation()}
							<Separator theme={theme} />
						</>
					) : (
						<>
							{this.renderAdmin()}
						</>
					)}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	Site_Name: state.settings.Site_Name,
	user: getUserSelector(state),
	baseUrl: state.server.server,
	loadingServer: state.server.loading,
	useRealName: state.settings.UI_Use_Real_Name,
	allowStatusMessage: state.settings.Accounts_AllowUserStatusMessageChange,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(Sidebar));

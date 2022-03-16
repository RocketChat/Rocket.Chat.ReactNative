import React, { Component } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerNavigationState } from '@react-navigation/native';
import { ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status/Status';
import { events, logEvent } from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from '../../lib/Navigation';
import SidebarItem from './SidebarItem';
import styles from './styles';
import { DrawerParamList } from '../../stacks/types';
import { TUserStatus } from '../../definitions';

interface ISeparatorProps {
	theme: string;
}

// TODO: remove this
const Separator = React.memo(({ theme }: ISeparatorProps) => (
	<View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />
));

interface ISidebarState {
	showStatus: boolean;
}

interface ISidebarProps {
	baseUrl: string;
	navigation: DrawerNavigationProp<DrawerParamList>;
	state: DrawerNavigationState<DrawerParamList>;
	Site_Name: string;
	user: {
		statusText: string;
		status: TUserStatus;
		username: string;
		name: string;
		roles: string[];
	};
	theme?: string;
	loadingServer: boolean;
	useRealName: boolean;
	allowStatusMessage: boolean;
	isMasterDetail: boolean;
	viewStatisticsPermission: string[];
	viewRoomAdministrationPermission: string[];
	viewUserAdministrationPermission: string[];
	viewPrivilegedSettingPermission: string[];
}

class Sidebar extends Component<ISidebarProps, ISidebarState> {
	constructor(props: ISidebarProps) {
		super(props);
		this.state = {
			showStatus: false
		};
	}

	shouldComponentUpdate(nextProps: ISidebarProps, nextState: ISidebarState) {
		const { showStatus } = this.state;
		const {
			Site_Name,
			user,
			baseUrl,
			state,
			isMasterDetail,
			useRealName,
			theme,
			viewStatisticsPermission,
			viewRoomAdministrationPermission,
			viewUserAdministrationPermission,
			viewPrivilegedSettingPermission
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
		if (!dequal(nextProps.user, user)) {
			return true;
		}
		if (nextProps.isMasterDetail !== isMasterDetail) {
			return true;
		}
		if (nextProps.useRealName !== useRealName) {
			return true;
		}
		if (!dequal(nextProps.viewStatisticsPermission, viewStatisticsPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewRoomAdministrationPermission, viewRoomAdministrationPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewUserAdministrationPermission, viewUserAdministrationPermission)) {
			return true;
		}
		if (!dequal(nextProps.viewPrivilegedSettingPermission, viewPrivilegedSettingPermission)) {
			return true;
		}
		return false;
	}

	getIsAdmin() {
		const {
			user,
			viewStatisticsPermission,
			viewRoomAdministrationPermission,
			viewUserAdministrationPermission,
			viewPrivilegedSettingPermission
		} = this.props;
		const { roles } = user;
		const allPermissions = [
			viewStatisticsPermission,
			viewRoomAdministrationPermission,
			viewUserAdministrationPermission,
			viewPrivilegedSettingPermission
		];
		let isAdmin = false;

		if (roles) {
			isAdmin = allPermissions.reduce((result: boolean, permission) => {
				if (permission) {
					return result || permission.some(r => roles.indexOf(r) !== -1);
				}
				return result;
			}, false);
		}
		return isAdmin;
	}

	sidebarNavigate = (route: string) => {
		// @ts-ignore
		logEvent(events[`SIDEBAR_GO_${route.replace('StackNavigator', '').replace('View', '').toUpperCase()}`]);
		Navigation.navigate(route);
	};

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
	};

	renderAdmin = () => {
		const { theme, isMasterDetail } = this.props;
		if (!this.getIsAdmin()) {
			return null;
		}
		const routeName = isMasterDetail ? 'AdminPanelView' : 'AdminPanelStackNavigator';
		return (
			<>
				<Separator theme={theme!} />
				<SidebarItem
					text={I18n.t('Admin_Panel')}
					left={<CustomIcon name='settings' size={20} color={themes[theme!].titleText} />}
					onPress={() => this.sidebarNavigate(routeName)}
					testID='sidebar-admin'
					theme={theme!}
					current={this.currentItemKey === routeName}
				/>
			</>
		);
	};

	renderNavigation = () => {
		const { theme } = this.props;
		return (
			<>
				<SidebarItem
					text={I18n.t('Chats')}
					left={<CustomIcon name='message' size={20} color={themes[theme!].titleText} />}
					onPress={() => this.sidebarNavigate('ChatsStackNavigator')}
					testID='sidebar-chats'
					theme={theme!}
					current={this.currentItemKey === 'ChatsStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Profile')}
					left={<CustomIcon name='user' size={20} color={themes[theme!].titleText} />}
					onPress={() => this.sidebarNavigate('ProfileStackNavigator')}
					testID='sidebar-profile'
					theme={theme!}
					current={this.currentItemKey === 'ProfileStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Display')}
					left={<CustomIcon name='sort' size={20} color={themes[theme!].titleText} />}
					onPress={() => this.sidebarNavigate('DisplayPrefStackNavigator')}
					testID='sidebar-display'
					theme={theme!}
					current={this.currentItemKey === 'DisplayPrefStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Settings')}
					left={<CustomIcon name='administration' size={20} color={themes[theme!].titleText} />}
					onPress={() => this.sidebarNavigate('SettingsStackNavigator')}
					testID='sidebar-settings'
					theme={theme!}
					current={this.currentItemKey === 'SettingsStackNavigator'}
				/>
				{this.renderAdmin()}
			</>
		);
	};

	renderCustomStatus = () => {
		const { user, theme } = this.props;
		return (
			<SidebarItem
				text={user.statusText || I18n.t('Edit_Status')}
				left={<Status size={24} status={user?.status} />}
				theme={theme!}
				right={<CustomIcon name='edit' size={20} color={themes[theme!].titleText} />}
				onPress={() => this.sidebarNavigate('StatusView')}
				testID='sidebar-custom-status'
			/>
		);
	};

	render() {
		const { user, Site_Name, baseUrl, useRealName, allowStatusMessage, isMasterDetail, theme } = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' style={{ backgroundColor: themes[theme!].focusedBackground }} vertical={isMasterDetail}>
				<ScrollView
					style={[
						styles.container,
						{
							backgroundColor: isMasterDetail ? themes[theme!].backgroundColor : themes[theme!].focusedBackground
						}
					]}
					{...scrollPersistTaps}>
					<TouchableWithoutFeedback onPress={this.onPressUser} testID='sidebar-close-drawer'>
						<View style={styles.header}>
							<Avatar text={user.username} style={styles.avatar} size={30} />
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Text numberOfLines={1} style={[styles.username, { color: themes[theme!].titleText }]}>
										{useRealName ? user.name : user.username}
									</Text>
								</View>
								<Text
									style={[styles.currentServerText, { color: themes[theme!].titleText }]}
									numberOfLines={1}
									accessibilityLabel={`Connected to ${baseUrl}`}>
									{Site_Name}
								</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>

					<Separator theme={theme!} />

					{allowStatusMessage ? this.renderCustomStatus() : null}
					{!isMasterDetail ? (
						<>
							<Separator theme={theme!} />
							{this.renderNavigation()}
							<Separator theme={theme!} />
						</>
					) : (
						<>{this.renderAdmin()}</>
					)}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	Site_Name: state.settings.Site_Name,
	user: getUserSelector(state),
	baseUrl: state.server.server,
	loadingServer: state.server.loading,
	useRealName: state.settings.UI_Use_Real_Name,
	allowStatusMessage: state.settings.Accounts_AllowUserStatusMessageChange,
	isMasterDetail: state.app.isMasterDetail,
	viewStatisticsPermission: state.permissions['view-statistics'],
	viewRoomAdministrationPermission: state.permissions['view-room-administration'],
	viewUserAdministrationPermission: state.permissions['view-user-administration'],
	viewPrivilegedSettingPermission: state.permissions['view-privileged-setting']
});

export default connect(mapStateToProps)(withTheme(Sidebar)) as any;

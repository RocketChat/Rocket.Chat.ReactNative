import React, { Component } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerNavigationState } from '@react-navigation/native';
import { Alert, Image, ScrollView, Text, TouchableWithoutFeedback, View, Linking } from 'react-native';
import { connect } from 'react-redux';
import { dequal } from 'dequal';
import { Dispatch } from 'redux';

import Avatar from '../../containers/Avatar';
import Status from '../../containers/Status/Status';
import { events, logEvent } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import userPreferences from '../../lib/methods/userPreferences';
import { CustomIcon } from '../../containers/CustomIcon';
import { NOTIFICATION_PRESENCE_CAP, STATUS_COLORS, themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from '../../lib/navigation/appNavigation';
import SidebarItem from './SidebarItem';
import styles from './styles';
import { DrawerParamList } from '../../stacks/types';
import { IApplicationState, IUser, TSVStatus } from '../../definitions';
import * as List from '../../containers/List';
import { IActionSheetProvider, showActionSheetRef, withActionSheet } from '../../containers/ActionSheet';
import { setNotificationPresenceCap } from '../../actions/app';
import { SupportedVersionsWarning } from '../../containers/SupportedVersions';

import { navigateTo247Chat, navToTechSupport, navigateToVirtualHappyHour } from '../HomeView/helpers';

const settingsIcon = require('../../static/images/sidepanel/settings.png');
const techSupportIcon = require('../../static/images/support-solid.png');
const calendarIcon = require('../../static/images/calendar-solid.png');
const discussionIcon = require('../../static/images/discussion-solid.png');
const peerSupportIcon = require('../../static/images/peer-supporter-solid.png');
const editIcon = require('../../static/images/sidepanel/edit.png');
const message247Icon = require('../../static/images/sidepanel/247.png');
const messagingIcon = require('../../static/images/sidepanel/messaging.png');
const happyHourIcon = require('../../static/images/happy-hour-solid.png');

interface ISidebarState {
	showStatus: boolean;
}

interface ISidebarProps {
	baseUrl: string;
	navigation?: DrawerNavigationProp<DrawerParamList>;
	dispatch: Dispatch;
	state?: DrawerNavigationState<DrawerParamList>;
	Site_Name: string;
	user: IUser;
	theme?: TSupportedThemes;
	loadingServer: boolean;
	useRealName: boolean;
	allowStatusMessage: boolean;
	notificationPresenceCap: boolean;
	Presence_broadcast_disabled: boolean;
	supportedVersionsStatus: TSVStatus;
	isMasterDetail: boolean;
	viewStatisticsPermission: string[];
	viewRoomAdministrationPermission: string[];
	viewUserAdministrationPermission: string[];
	viewPrivilegedSettingPermission: string[];
	showActionSheet: IActionSheetProvider['showActionSheet'];
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
			notificationPresenceCap,
			useRealName,
			theme,
			Presence_broadcast_disabled,
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
		if (nextProps.notificationPresenceCap !== notificationPresenceCap) {
			return true;
		}
		if (nextProps.useRealName !== useRealName) {
			return true;
		}
		if (nextProps.Presence_broadcast_disabled !== Presence_broadcast_disabled) {
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
		this.sidebarNavigate('HomeStackNavigator');
		navigation?.closeDrawer();
	};

	onPressLearnMorePresenceCap = () => {
		Linking.openURL('https://go.rocket.chat/i/presence-cap-learn-more');
	};

	onPressPresenceLearnMore = () => {
		const { dispatch } = this.props;
		dispatch(setNotificationPresenceCap(false));
		userPreferences.setBool(NOTIFICATION_PRESENCE_CAP, false);

		Alert.alert(
			I18n.t('Presence_Cap_Warning_Title'),
			I18n.t('Presence_Cap_Warning_Description'),
			[
				{
					text: I18n.t('Learn_more'),
					onPress: this.onPressLearnMorePresenceCap,
					style: 'cancel'
				},
				{
					text: I18n.t('Close'),
					style: 'default'
				}
			],
			{ cancelable: false }
		);
	};

	renderAdmin = () => {
		const { theme, isMasterDetail } = this.props;
		if (!this.getIsAdmin()) {
			return null;
		}
		const routeName = isMasterDetail ? 'AdminPanelView' : 'AdminPanelStackNavigator';
		return (
			<>
				<List.Separator />
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


	additionalPanels = (theme, iconStyle) => {
		const iconStyles = { ...iconStyle, backgroundColor: 'black' };
		const isPeerSupporter = this.props.user?.roles?.includes('peer-supporter');
		const admin = this.getIsAdmin();

		if (!isPeerSupporter && !admin) {
			return null;
		}

		return (
			<>
				{isPeerSupporter && (
					<SidebarItem
						text={I18n.t('PostModeration')}
						left={<View style={iconStyles} />}
						onPress={() => this.sidebarNavigate('ChatsStackNavigator')}
						testID='sidebar-chats'
						theme={theme!}
						disabled={true}
					/>
				)}
				<List.Separator />
			</>
		);
	};

	renderNavigation = () => {
		const { theme } = this.props;
		const iconStyles = { height: 20, width: 20, tintColor: themes[theme!].titleText, borderRadius: 10 };
		return (
			<>
				{this.additionalPanels(theme, iconStyles)}
				<SidebarItem
					text={I18n.t('Home')}
					left={<CustomIcon name='home' size={24} color={iconStyles.tintColor}/>}
					onPress={() => this.sidebarNavigate('HomeStackNavigator')}
					testID='home-screen'
					theme={theme!}
					current={this.currentItemKey === 'HomeStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('Chats')}
					left={<Image source={messagingIcon} style={iconStyles} />}
					onPress={() => this.sidebarNavigate('ChatsStackNavigator')}
					testID='sidebar-chats'
					theme={theme!}
					current={this.currentItemKey === 'ChatsStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('DiscussionBoards')}
					left={<Image source={discussionIcon} style={iconStyles} />}
					onPress={() => this.sidebarNavigate('DiscussionStackNavigator')}
					testID='sidebar-discussion'
					theme={theme!}
					current={this.currentItemKey === 'DiscussionStackNavigator'}
				/>
				<SidebarItem
					text={I18n.t('PeerSupporterLibrary')}
					left={<Image source={peerSupportIcon} style={iconStyles} />}
					onPress={() => this.sidebarNavigate('ProfileLibraryNavigator')}
					testID='sidebar-profile-library'
					current={this.currentItemKey === 'ProfileLibraryNavigator'}
				/>
				<SidebarItem
					text={I18n.t('247ChatRoom')}
					left={<Image source={message247Icon} style={iconStyles} resizeMode='contain' />}
					onPress={() => {
						navigateTo247Chat(Navigation, this.props.isMasterDetail);
					}}
					testID='sidebar-247chat'
					theme={theme!}
					current={this.currentItemKey === 'todo'}
				/>
				<SidebarItem
					text={I18n.t('VirtualHappyHour')}
					left={<Image source={happyHourIcon} style={iconStyles} />}
					onPress={() => {
						navigateToVirtualHappyHour(Navigation, this.props.isMasterDetail)
					}}
					testID='sidebar-happy-hour'
					theme={theme!}
					current={this.currentItemKey === 'todo'}
				/>
				<SidebarItem
					text={I18n.t('Calendar')}
					left={<Image source={calendarIcon} style={iconStyles} />}
					onPress={() => {
						// this.sidebarNavigate('DisplayPrefStackNavigator')
					}}
					testID='sidebar-calendar'
					theme={theme!}
					current={this.currentItemKey === 'todo'}
					disabled={true}
				/>
				<SidebarItem
					text={I18n.t('TechSupport')}
					left={<Image source={techSupportIcon} style={iconStyles} />}
					onPress={() => {
						navToTechSupport(Navigation, this.props.isMasterDetail)
					}}
					testID='sidebar-tech-support'
					theme={theme!}
					current={this.currentItemKey === 'todo'}
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
		const iconStyles = { height: 20, width: 20, tintColor: themes[theme!].titleText };
		return (
			<SidebarItem
				text={user.statusText || I18n.t('Edit_Status')}
				left={<Status size={24} status={user?.status} />}
				theme={theme!}
				right={
					<Image source={editIcon} style={iconStyles} />
				}
				onPress={() => this.sidebarNavigate('StatusView')}
				testID={`sidebar-custom-status-${user.status}`}
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
					{...scrollPersistTaps}
				>
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
									accessibilityLabel={`Connected to ${baseUrl}`}
								>
									{Site_Name}
								</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>

					<List.Separator />

					{allowStatusMessage ? this.renderCustomStatus() : null}
					{!isMasterDetail ? (
						<>
							<List.Separator />
							{this.renderNavigation()}
							<List.Separator />
						</>
					) : (
						<>{this.renderAdmin()}</>
					)}
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	Site_Name: state.settings.Site_Name as string,
	user: getUserSelector(state),
	baseUrl: state.server.server,
	loadingServer: state.server.loading,
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	allowStatusMessage: state.settings.Accounts_AllowUserStatusMessageChange as boolean,
	Presence_broadcast_disabled: state.settings.Presence_broadcast_disabled as boolean,
	notificationPresenceCap: state.app.notificationPresenceCap,
	isMasterDetail: state.app.isMasterDetail,
	viewStatisticsPermission: state.permissions['view-statistics'] as string[],
	viewRoomAdministrationPermission: state.permissions['view-room-administration'] as string[],
	viewUserAdministrationPermission: state.permissions['view-user-administration'] as string[],
	viewPrivilegedSettingPermission: state.permissions['view-privileged-setting'] as string[]
});

export default connect(mapStateToProps)(withActionSheet(withTheme(Sidebar)));

import React, { Component } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerNavigationState } from '@react-navigation/native';
import { Alert, ScrollView, Text, TouchableWithoutFeedback, View, Linking } from 'react-native';
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
import { NOTIFICATION_PRESENCE_CAP, themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from '../../lib/navigation/appNavigation';
import styles from './styles';
import { DrawerParamList } from '../../stacks/types';
import { IApplicationState, IUser, TSVStatus } from '../../definitions';
import * as List from '../../containers/List';
import { IActionSheetProvider, showActionSheetRef, withActionSheet } from '../../containers/ActionSheet';
import { setNotificationPresenceCap } from '../../actions/app';
import { SupportedVersionsWarning } from '../../containers/SupportedVersions';

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
			supportedVersionsStatus,
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
		if (nextProps.supportedVersionsStatus !== supportedVersionsStatus) {
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

	onPressSupportedVersionsWarning = () => {
		const { isMasterDetail } = this.props;
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'SupportedVersionsWarning' });
		} else {
			showActionSheetRef({ children: <SupportedVersionsWarning /> });
		}
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
				<List.Item
					title={'Admin_Panel'}
					left={() => <List.Icon name='settings' />}
					onPress={() => this.sidebarNavigate(routeName)}
					backgroundColor={this.currentItemKey === routeName ? themes[theme!].strokeLight : undefined}
				/>
			</>
		);
	};

	renderNavigation = () => {
		const { theme } = this.props;
		return (
			<>
				<List.Item
					title={'Chats'}
					left={() => <List.Icon name='message' />}
					onPress={() => this.sidebarNavigate('ChatsStackNavigator')}
					backgroundColor={this.currentItemKey === 'ChatsStackNavigator' ? themes[theme!].strokeLight : undefined}
					testID='sidebar-chats'
				/>
				<List.Separator />
				<List.Item
					title={'Profile'}
					left={() => <List.Icon name='user' />}
					onPress={() => this.sidebarNavigate('ProfileStackNavigator')}
					backgroundColor={this.currentItemKey === 'ProfileStackNavigator' ? themes[theme!].strokeLight : undefined}
					testID='sidebar-profile'
				/>
				<List.Separator />
				<List.Item
					title={'Display'}
					left={() => <List.Icon name='sort' />}
					onPress={() => this.sidebarNavigate('DisplayPrefStackNavigator')}
					backgroundColor={this.currentItemKey === 'DisplayPrefStackNavigator' ? themes[theme!].strokeLight : undefined}
					testID='sidebar-display'
				/>
				<List.Separator />
				<List.Item
					title={'Settings'}
					left={() => <List.Icon name='administration' />}
					onPress={() => this.sidebarNavigate('SettingsStackNavigator')}
					backgroundColor={this.currentItemKey === 'SettingsStackNavigator' ? themes[theme!].strokeLight : undefined}
					testID='sidebar-settings'
				/>
				{this.renderAdmin()}
			</>
		);
	};

	renderCustomStatus = () => {
		const { user, theme, Presence_broadcast_disabled, notificationPresenceCap } = this.props;

		let status = user?.status;
		if (Presence_broadcast_disabled) {
			status = 'disabled';
		}

		let right: (() => JSX.Element | null) | undefined = () => (
			<CustomIcon name='edit' size={20} color={themes[theme!].fontTitlesLabels} />
		);
		if (notificationPresenceCap) {
			right = () => <View style={[styles.customStatusDisabled, { backgroundColor: themes[theme!].userPresenceDisabled }]} />;
		} else if (Presence_broadcast_disabled) {
			right = undefined;
		}

		return (
			<List.Item
				title={user.statusText || 'Edit_Status'}
				left={() => <Status size={24} status={status} />}
				right={right}
				onPress={() => (Presence_broadcast_disabled ? this.onPressPresenceLearnMore() : this.sidebarNavigate('StatusView'))}
				translateTitle={!user.statusText}
				testID={`sidebar-custom-status-${user.status}`}
			/>
		);
	};

	renderSupportedVersionsWarn = () => {
		const { theme, supportedVersionsStatus } = this.props;
		if (supportedVersionsStatus === 'warn') {
			return (
				<>
					<List.Separator />
					<List.Item
						title={'Supported_versions_warning_update_required'}
						color={themes[theme!].fontDanger}
						left={() => <CustomIcon name='warning' size={20} color={themes[theme!].buttonBackgroundDangerDefault} />}
						onPress={() => this.onPressSupportedVersionsWarning()}
						testID={`sidebar-supported-versions-warn`}
					/>
				</>
			);
		}
		return null;
	};

	render() {
		const { user, Site_Name, baseUrl, useRealName, allowStatusMessage, isMasterDetail, theme } = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' vertical={isMasterDetail}>
				<ScrollView style={styles.container} {...scrollPersistTaps}>
					<List.Separator />
					<TouchableWithoutFeedback onPress={this.onPressUser} testID='sidebar-close-drawer'>
						<View style={[styles.header, { backgroundColor: themes[theme!].surfaceRoom }]}>
							<Avatar text={user.username} style={styles.avatar} size={30} />
							<View style={styles.headerTextContainer}>
								<View style={styles.headerUsername}>
									<Text numberOfLines={1} style={[styles.username, { color: themes[theme!].fontTitlesLabels }]}>
										{useRealName ? user.name : user.username}
									</Text>
								</View>
								<Text
									style={[styles.currentServerText, { color: themes[theme!].fontTitlesLabels }]}
									numberOfLines={1}
									accessibilityLabel={`Connected to ${baseUrl}`}>
									{Site_Name}
								</Text>
							</View>
						</View>
					</TouchableWithoutFeedback>

					{this.renderSupportedVersionsWarn()}

					<List.Separator />

					{allowStatusMessage !== false ? this.renderCustomStatus() : null}
					{!isMasterDetail ? (
						<>
							<List.Separator />
							{this.renderNavigation()}
						</>
					) : (
						<>{this.renderAdmin()}</>
					)}

					<List.Separator />
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
	supportedVersionsStatus: state.supportedVersions.status,
	isMasterDetail: state.app.isMasterDetail,
	viewStatisticsPermission: state.permissions['view-statistics'] as string[],
	viewRoomAdministrationPermission: state.permissions['view-room-administration'] as string[],
	viewUserAdministrationPermission: state.permissions['view-user-administration'] as string[],
	viewPrivilegedSettingPermission: state.permissions['view-privileged-setting'] as string[]
});

export default connect(mapStateToProps)(withActionSheet(withTheme(Sidebar)));

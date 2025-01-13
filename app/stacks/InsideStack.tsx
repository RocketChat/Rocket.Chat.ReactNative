import React from 'react';
import { I18nManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import Sidebar from '../views/SidebarView';
// Chats Stack
import RoomView from '../views/RoomView';
import RoomsListView from '../views/RoomsListView';
import RoomActionsView from '../views/RoomActionsView';
import RoomInfoView from '../views/RoomInfoView';
import ReportUserView from '../views/ReportUserView';
import RoomInfoEditView from '../views/RoomInfoEditView';
import RoomMembersView from '../views/RoomMembersView';
import SearchMessagesView from '../views/SearchMessagesView';
import SelectedUsersView from '../views/SelectedUsersView';
import InviteUsersView from '../views/InviteUsersView';
import InviteUsersEditView from '../views/InviteUsersEditView';
import MessagesView from '../views/MessagesView';
import AutoTranslateView from '../views/AutoTranslateView';
import DirectoryView from '../views/DirectoryView';
import NotificationPrefView from '../views/NotificationPreferencesView';
import E2EEToggleRoomView from '../views/E2EEToggleRoomView';
import ForwardLivechatView from '../views/ForwardLivechatView';
import CloseLivechatView from '../views/CloseLivechatView';
import LivechatEditView from '../views/LivechatEditView';
import PickerView from '../views/PickerView';
import ThreadMessagesView from '../views/ThreadMessagesView';
import TeamChannelsView from '../views/TeamChannelsView';
import MarkdownTableView from '../views/MarkdownTableView';
import ReadReceiptsView from '../views/ReadReceiptView';
import CannedResponsesListView from '../views/CannedResponsesListView';
import CannedResponseDetail from '../views/CannedResponseDetail';
// Profile Stack
import ProfileView from '../views/ProfileView';
import UserPreferencesView from '../views/UserPreferencesView';
import UserNotificationPrefView from '../views/UserNotificationPreferencesView';
// Display Preferences View
import DisplayPrefsView from '../views/DisplayPrefsView';
// Settings Stack
import SettingsView from '../views/SettingsView';
import SecurityPrivacyView from '../views/SecurityPrivacyView';
import GetHelpView from '../views/GetHelpView';
import PushTroubleshootView from '../views/PushTroubleshootView';
import E2EEncryptionSecurityView from '../views/E2EEncryptionSecurityView';
import LanguageView from '../views/LanguageView';
import ThemeView from '../views/ThemeView';
import DefaultBrowserView from '../views/DefaultBrowserView';
import ScreenLockConfigView from '../views/ScreenLockConfigView';
import MediaAutoDownloadView from '../views/MediaAutoDownloadView';
// Admin Stack
import AdminPanelView from '../views/AdminPanelView';
// NewMessage Stack
import NewMessageView from '../views/NewMessageView';
import CreateChannelView from '../views/CreateChannelView';
// E2ESaveYourPassword Stack
import E2ESaveYourPasswordView from '../views/E2ESaveYourPasswordView';
import E2EHowItWorksView from '../views/E2EHowItWorksView';
// E2EEnterYourPassword Stack
import E2EEnterYourPasswordView from '../views/E2EEnterYourPasswordView';
// InsideStackNavigator
import AttachmentView from '../views/AttachmentView';
import ModalBlockView from '../views/ModalBlockView';
import JitsiMeetView from '../views/JitsiMeetView';
import StatusView from '../views/StatusView';
import ShareView from '../views/ShareView';
import CreateDiscussionView from '../views/CreateDiscussionView';
import ForwardMessageView from '../views/ForwardMessageView';
import QueueListView from '../ee/omnichannel/views/QueueListView';
import AddChannelTeamView from '../views/AddChannelTeamView';
import AddExistingChannelView from '../views/AddExistingChannelView';
import SelectListView from '../views/SelectListView';
import DiscussionsView from '../views/DiscussionsView';
import ChangeAvatarView from '../views/ChangeAvatarView';
import LegalView from '../views/LegalView';
import {
	AdminPanelStackParamList,
	ChatsStackParamList,
	DisplayPrefStackParamList,
	DrawerParamList,
	E2EEnterYourPasswordStackParamList,
	E2ESaveYourPasswordStackParamList,
	InsideStackParamList,
	NewMessageStackParamList,
	ProfileStackParamList,
	SettingsStackParamList
} from './types';
import { isIOS } from '../lib/methods/helpers';
import { TNavigation } from './stackType';

// ChatsStackNavigator
const ChatsStack = createNativeStackNavigator<ChatsStackParamList & TNavigation>();
const ChatsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ChatsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<ChatsStack.Screen name='RoomsListView' component={RoomsListView} />
			<ChatsStack.Screen name='RoomView' component={RoomView} />
			<ChatsStack.Screen name='RoomActionsView' component={RoomActionsView} options={RoomActionsView.navigationOptions} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='SelectListView' component={SelectListView} options={SelectListView.navigationOptions} />
			<ChatsStack.Screen name='RoomInfoView' component={RoomInfoView} />
			<ChatsStack.Screen name='ReportUserView' component={ReportUserView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
			<ChatsStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
			<ChatsStack.Screen name='RoomMembersView' component={RoomMembersView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='DiscussionsView' component={DiscussionsView} />
			<ChatsStack.Screen
				name='SearchMessagesView'
				// @ts-ignore
				component={SearchMessagesView}
				options={SearchMessagesView.navigationOptions}
			/>
			<ChatsStack.Screen name='SelectedUsersView' component={SelectedUsersView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='InviteUsersView' component={InviteUsersView} />
			<ChatsStack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
			<ChatsStack.Screen name='MessagesView' component={MessagesView} />
			<ChatsStack.Screen name='AutoTranslateView' component={AutoTranslateView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='DirectoryView' component={DirectoryView} options={DirectoryView.navigationOptions} />
			<ChatsStack.Screen name='NotificationPrefView' component={NotificationPrefView} />
			<ChatsStack.Screen name='E2EEToggleRoomView' component={E2EEToggleRoomView} />
			<ChatsStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
			<ChatsStack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='CloseLivechatView' component={CloseLivechatView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
			<ChatsStack.Screen name='PickerView' component={PickerView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='ThreadMessagesView' component={ThreadMessagesView} />
			<ChatsStack.Screen name='TeamChannelsView' component={TeamChannelsView} />
			<ChatsStack.Screen name='CreateChannelView' component={CreateChannelView} />
			<ChatsStack.Screen name='AddChannelTeamView' component={AddChannelTeamView} />
			<ChatsStack.Screen name='AddExistingChannelView' component={AddExistingChannelView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='MarkdownTableView' component={MarkdownTableView} />
			{/* @ts-ignore */}
			<ChatsStack.Screen name='ReadReceiptsView' component={ReadReceiptsView} options={ReadReceiptsView.navigationOptions} />
			<ChatsStack.Screen name='QueueListView' component={QueueListView} />
			<ChatsStack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
			<ChatsStack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
			<ChatsStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{
					headerShown: false,
					animation: isIOS ? 'default' : 'none'
				}}
			/>
		</ChatsStack.Navigator>
	);
};

// ProfileStackNavigator
const ProfileStack = createNativeStackNavigator<ProfileStackParamList & TNavigation>();
const ProfileStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ProfileStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<ProfileStack.Screen name='ProfileView' component={ProfileView} options={ProfileView.navigationOptions} />
			<ProfileStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
			<ProfileStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
			<ProfileStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
			<ProfileStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
			<ProfileStack.Screen name='PickerView' component={PickerView} />
		</ProfileStack.Navigator>
	);
};

// SettingsStackNavigator
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const SettingsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<SettingsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<SettingsStack.Screen name='SettingsView' component={SettingsView} />
			<SettingsStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
			<SettingsStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
			<SettingsStack.Screen name='E2EEncryptionSecurityView' component={E2EEncryptionSecurityView} />
			<SettingsStack.Screen name='LanguageView' component={LanguageView} />
			<SettingsStack.Screen name='ThemeView' component={ThemeView} />
			<SettingsStack.Screen name='DefaultBrowserView' component={DefaultBrowserView} />
			<SettingsStack.Screen name='MediaAutoDownloadView' component={MediaAutoDownloadView} />
			<SettingsStack.Screen name='GetHelpView' component={GetHelpView} />
			{/* @ts-ignore */}
			<SettingsStack.Screen name='LegalView' component={LegalView} />
			<SettingsStack.Screen
				name='ScreenLockConfigView'
				// @ts-ignore
				component={ScreenLockConfigView}
				options={ScreenLockConfigView.navigationOptions}
			/>
		</SettingsStack.Navigator>
	);
};

// AdminPanelStackNavigator
const AdminPanelStack = createNativeStackNavigator<AdminPanelStackParamList>();
const AdminPanelStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AdminPanelStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<AdminPanelStack.Screen name='AdminPanelView' component={AdminPanelView} />
		</AdminPanelStack.Navigator>
	);
};

// DisplayPreferenceNavigator
const DisplayPrefStack = createNativeStackNavigator<DisplayPrefStackParamList>();
const DisplayPrefStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<DisplayPrefStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<DisplayPrefStack.Screen name='DisplayPrefsView' component={DisplayPrefsView} />
		</DisplayPrefStack.Navigator>
	);
};

// DrawerNavigator
const Drawer = createDrawerNavigator<DrawerParamList>();
const DrawerNavigator = () => {
	const { colors } = React.useContext(ThemeContext);

	return (
		<Drawer.Navigator
			// @ts-ignore
			drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}
			screenOptions={{
				swipeEnabled: false,
				headerShown: false,
				drawerPosition: I18nManager.isRTL ? 'right' : 'left',
				drawerType: 'slide',
				overlayColor: `rgba(0,0,0,${colors.backdropOpacity})`,
				freezeOnBlur: true
			}}>
			<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
			<Drawer.Screen name='ProfileStackNavigator' component={ProfileStackNavigator} />
			<Drawer.Screen name='SettingsStackNavigator' component={SettingsStackNavigator} />
			<Drawer.Screen name='AdminPanelStackNavigator' component={AdminPanelStackNavigator} />
			<Drawer.Screen name='DisplayPrefStackNavigator' component={DisplayPrefStackNavigator} />
		</Drawer.Navigator>
	);
};

// NewMessageStackNavigator
const NewMessageStack = createNativeStackNavigator<NewMessageStackParamList>();
const NewMessageStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<NewMessageStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<NewMessageStack.Screen name='NewMessageView' component={NewMessageView} />
			<NewMessageStack.Screen name='SelectedUsersViewCreateChannel' component={SelectedUsersView} />
			<NewMessageStack.Screen name='CreateChannelView' component={CreateChannelView} />
			{/* @ts-ignore */}
			<NewMessageStack.Screen name='CreateDiscussionView' component={CreateDiscussionView} />
			<NewMessageStack.Screen name='ForwardMessageView' component={ForwardMessageView} />
		</NewMessageStack.Navigator>
	);
};

// E2ESaveYourPasswordStackNavigator
const E2ESaveYourPasswordStack = createNativeStackNavigator<E2ESaveYourPasswordStackParamList>();
const E2ESaveYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2ESaveYourPasswordStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<E2ESaveYourPasswordStack.Screen name='E2ESaveYourPasswordView' component={E2ESaveYourPasswordView} />
			<E2ESaveYourPasswordStack.Screen name='E2EHowItWorksView' component={E2EHowItWorksView} />
		</E2ESaveYourPasswordStack.Navigator>
	);
};

// E2EEnterYourPasswordStackNavigator
const E2EEnterYourPasswordStack = createNativeStackNavigator<E2EEnterYourPasswordStackParamList>();
const E2EEnterYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2EEnterYourPasswordStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<E2EEnterYourPasswordStack.Screen name='E2EEnterYourPasswordView' component={E2EEnterYourPasswordView} />
		</E2EEnterYourPasswordStack.Navigator>
	);
};

// InsideStackNavigator
const InsideStack = createNativeStackNavigator<InsideStackParamList & TNavigation>();
const InsideStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), presentation: 'containedModal' }}>
			<InsideStack.Screen name='DrawerNavigator' component={DrawerNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen name='NewMessageStackNavigator' component={NewMessageStackNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen
				name='E2ESaveYourPasswordStackNavigator'
				component={E2ESaveYourPasswordStackNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='E2EEnterYourPasswordStackNavigator'
				component={E2EEnterYourPasswordStackNavigator}
				options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
			/>
			<InsideStack.Screen name='AttachmentView' component={AttachmentView} />
			<InsideStack.Screen
				name='StatusView'
				component={StatusView}
				options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
			/>
			{/* @ts-ignore */}
			<InsideStack.Screen name='ShareView' component={ShareView} />
			{/* @ts-ignore */}
			<InsideStack.Screen name='ModalBlockView' component={ModalBlockView} options={ModalBlockView.navigationOptions} />
		</InsideStack.Navigator>
	);
};

export default InsideStackNavigator;

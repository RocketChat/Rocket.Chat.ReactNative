import React from 'react';
import { I18nManager } from 'react-native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../theme';
import { ModalAnimation, StackAnimation, defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
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
import { themes } from '../lib/constants';
// Profile Stack
import ProfileView from '../views/ProfileView';
import UserPreferencesView from '../views/UserPreferencesView';
import UserNotificationPrefView from '../views/UserNotificationPreferencesView';
// Display Preferences View
import DisplayPrefsView from '../views/DisplayPrefsView';
// Settings Stack
import SettingsView from '../views/SettingsView';
import SecurityPrivacyView from '../views/SecurityPrivacyView';
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
import {
	AdminPanelStackParamList,
	ChatsStackParamList,
	DisplayPrefStackParamList,
	DrawerParamList,
	E2EEnterYourPasswordStackParamList,
	E2ESaveYourPasswordStackParamList,
	HomeStackParamList,
	InsideStackParamList,
	NewMessageStackParamList,
	ProfileStackParamList,
	SettingsStackParamList
} from './types';
import { isIOS } from '../lib/methods/helpers';
import { TNavigation } from './stackType';

// Profile Library Stack
import ProfileLibraryView from '../views/ProfileLibrary';
// Home Stack
import HomeView from '../views/HomeView';
// Discussion Stack
import DiscussionBoardView from '../views/DiscussionBoard/DiscussionBoardView';
import DiscussionPostView from '../views/DiscussionBoard/PostView';
import DiscussionHomeView from '../views/DiscussionBoard/DiscussionHomeView';
import DiscussionNewPostView from '../views/DiscussionBoard/NewPostView';
import DiscussionSearchView from '../views/DiscussionBoard/SearchView';
import ConnectView from '../views/DiscussionBoard/ConnectView';

// DisplayPreferenceNavigator
const DisplayPrefStack = createStackNavigator<DisplayPrefStackParamList>();
const DisplayPrefStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<DisplayPrefStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<DisplayPrefStack.Screen name='DisplayPrefsView' component={DisplayPrefsView} />
		</DisplayPrefStack.Navigator>
	);
};

/**
  MainStackNavigator includes all views from:
  - HomeStackNavigator
  - ChatsStackNavigator
  - ProfileLibraryStackNavigator
  - ProfileStackNavigator
  - SettingsStackNavigator
  - DiscussionStackNavigator
  - AdminPanelStackNavigator
  **/
const MainStack = createStackNavigator();
const MainStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<MainStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			{/* HomeStackNavigator */}
			<MainStack.Screen name='HomeView' component={HomeView} />
			<MainStack.Screen name='RoomView' component={RoomView} />
			{/* ChatsStackNavigator */}
			<MainStack.Screen name='RoomsListView' component={RoomsListView} />
			<MainStack.Screen name='RoomActionsView' component={RoomActionsView} options={RoomActionsView.navigationOptions} />
			<MainStack.Screen name='RoomInfoView' component={RoomInfoView} />
			<MainStack.Screen name='ReportUserView' component={ReportUserView} />
			<MainStack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
			<MainStack.Screen name='RoomMembersView' component={RoomMembersView} />
			<MainStack.Screen name='SearchMessagesView' component={SearchMessagesView} options={SearchMessagesView.navigationOptions} />
			<MainStack.Screen name='SelectedUsersView' component={SelectedUsersView} />
			<MainStack.Screen name='InviteUsersView' component={InviteUsersView} />
			<MainStack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
			<MainStack.Screen name='MessagesView' component={MessagesView} />
			<MainStack.Screen name='AutoTranslateView' component={AutoTranslateView} />
			<MainStack.Screen name='DirectoryView' component={DirectoryView} options={DirectoryView.navigationOptions} />
			<MainStack.Screen name='NotificationPrefView' component={NotificationPrefView} />
			<MainStack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
			<MainStack.Screen name='CloseLivechatView' component={CloseLivechatView} />
			<MainStack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
			<MainStack.Screen name='PickerView' component={PickerView} />
			<MainStack.Screen name='ThreadMessagesView' component={ThreadMessagesView} />
			<MainStack.Screen name='TeamChannelsView' component={TeamChannelsView} />
			<MainStack.Screen name='CreateChannelView' component={CreateChannelView} />
			<MainStack.Screen name='MarkdownTableView' component={MarkdownTableView} />
			<MainStack.Screen name='ReadReceiptsView' component={ReadReceiptsView} options={ReadReceiptsView.navigationOptions} />
			<MainStack.Screen name='QueueListView' component={QueueListView} />
			<MainStack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
			<MainStack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
			{/* ProfileLibraryStackNavigator */}
			<MainStack.Screen name='ProfileLibraryView' component={ProfileLibraryView} options={ProfileLibraryView.navigationOptions} />
			<MainStack.Screen name='ConnectView' component={ConnectView} options={{ title: 'Profile' }} />
			{/* ProfileStackNavigator */}
			<MainStack.Screen name='ProfileView' component={ProfileView} options={ProfileView.navigationOptions} />
			<MainStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
			<MainStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
			<MainStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
			{/* SettingsStackNavigator */}
			<MainStack.Screen name='SettingsView' component={SettingsView} />
			<MainStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
			<MainStack.Screen name='E2EEncryptionSecurityView' component={E2EEncryptionSecurityView} />
			<MainStack.Screen name='LanguageView' component={LanguageView} />
			<MainStack.Screen name='ThemeView' component={ThemeView} />
			<MainStack.Screen name='DefaultBrowserView' component={DefaultBrowserView} />
			<MainStack.Screen name='MediaAutoDownloadView' component={MediaAutoDownloadView} />
			<MainStack.Screen name='ScreenLockConfigView' component={ScreenLockConfigView} options={ScreenLockConfigView.navigationOptions} />
			{/* DiscussionStackNavigator */}
			<MainStack.Screen name='DiscussionHomeView' component={DiscussionHomeView} options={DiscussionHomeView.navigationOptions} />
			<MainStack.Screen name='DiscussionBoardView' component={DiscussionBoardView} options={DiscussionBoardView.navigationOptions} />
			<MainStack.Screen name='DiscussionPostView' component={DiscussionPostView} options={DiscussionPostView.navigationOptions} />
			<MainStack.Screen name='DiscussionNewPostView' component={DiscussionNewPostView} options={DiscussionNewPostView.navigationOptions} />
			<MainStack.Screen name='DiscussionSearchView' component={DiscussionSearchView} options={DiscussionSearchView.navigationOptions} />
			{/* AdminPanelStackNavigator */}
			<MainStack.Screen name='AdminPanelView' component={AdminPanelView} />
		</MainStack.Navigator>
	);
};

// DrawerNavigator
const Drawer = createDrawerNavigator<DrawerParamList>();
const DrawerNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<Drawer.Navigator
			// @ts-ignore
			drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}
			useLegacyImplementation={true}
			screenOptions={{
				swipeEnabled: false,
				headerShown: false,
				drawerPosition: I18nManager.isRTL ? 'right' : 'left',
				drawerType: 'back',
				overlayColor: `rgba(0,0,0,${themes[theme].backdropOpacity})`
			}}
		>
			<Drawer.Screen name='MainStackNavigator' component={MainStackNavigator} />
			<Drawer.Screen name='DisplayPrefStackNavigator' component={DisplayPrefStackNavigator} />
		</Drawer.Navigator>
	);
};

// NewMessageStackNavigator
const NewMessageStack = createStackNavigator<NewMessageStackParamList>();
const NewMessageStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<NewMessageStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<NewMessageStack.Screen name='NewMessageView' component={NewMessageView} />
			<NewMessageStack.Screen name='SelectedUsersViewCreateChannel' component={SelectedUsersView} />
			<NewMessageStack.Screen name='CreateChannelView' component={CreateChannelView} />
			<NewMessageStack.Screen name='CreateDiscussionView' component={CreateDiscussionView} />
			<NewMessageStack.Screen name='ForwardMessageView' component={ForwardMessageView} />
		</NewMessageStack.Navigator>
	);
};

// E2ESaveYourPasswordStackNavigator
const E2ESaveYourPasswordStack = createStackNavigator<E2ESaveYourPasswordStackParamList>();
const E2ESaveYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2ESaveYourPasswordStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<E2ESaveYourPasswordStack.Screen name='E2ESaveYourPasswordView' component={E2ESaveYourPasswordView} />
			<E2ESaveYourPasswordStack.Screen name='E2EHowItWorksView' component={E2EHowItWorksView} />
		</E2ESaveYourPasswordStack.Navigator>
	);
};

// E2EEnterYourPasswordStackNavigator
const E2EEnterYourPasswordStack = createStackNavigator<E2EEnterYourPasswordStackParamList>();
const E2EEnterYourPasswordStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<E2EEnterYourPasswordStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<E2EEnterYourPasswordStack.Screen name='E2EEnterYourPasswordView' component={E2EEnterYourPasswordView} />
		</E2EEnterYourPasswordStack.Navigator>
	);
};

/**
  Note that InsideStackNavigator is the main stack for the app
  By default, it passes control to its first screen, DrawerNavigator
  And DrawerNavigator passes control to MainStackNavigator
  In general, nest navigators only if the navigator (which is also a screen) needs to have a different header or different navigation options than other navigators
 **/
const InsideStack = createStackNavigator<InsideStackParamList & TNavigation>();
const InsideStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation, presentation: 'transparentModal' }}
		>
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
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen name='AttachmentView' component={AttachmentView} />
			<InsideStack.Screen name='StatusView' component={StatusView} />
			<InsideStack.Screen name='ShareView' component={ShareView} />
			<InsideStack.Screen name='ModalBlockView' component={ModalBlockView} options={ModalBlockView.navigationOptions} />
		</InsideStack.Navigator>
	);
};

export default InsideStackNavigator;

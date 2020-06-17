import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../theme';
import {
	defaultHeader, themedHeader, ModalAnimation, StackAnimation
} from '../utils/navigation';
import Sidebar from '../views/SidebarView';

// Chats Stack
import RoomView from '../views/RoomView';
import RoomsListView from '../views/RoomsListView';
import RoomActionsView from '../views/RoomActionsView';
import RoomInfoView from '../views/RoomInfoView';
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
import VisitorNavigationView from '../views/VisitorNavigationView';
import ForwardLivechatView from '../views/ForwardLivechatView';
import LivechatEditView from '../views/LivechatEditView';
import PickerView from '../views/PickerView';
import ThreadMessagesView from '../views/ThreadMessagesView';
import MarkdownTableView from '../views/MarkdownTableView';
import ReadReceiptsView from '../views/ReadReceiptView';

// Profile Stack
import ProfileView from '../views/ProfileView';

// Settings Stack
import SettingsView from '../views/SettingsView';
import LanguageView from '../views/LanguageView';
import ThemeView from '../views/ThemeView';
import DefaultBrowserView from '../views/DefaultBrowserView';
import ScreenLockConfigView from '../views/ScreenLockConfigView';

// Admin Stack
import AdminPanelView from '../views/AdminPanelView';

// NewMessage Stack
import NewMessageView from '../views/NewMessageView';
import CreateChannelView from '../views/CreateChannelView';

// InsideStackNavigator
import AttachmentView from '../views/AttachmentView';
import ModalBlockView from '../views/ModalBlockView';
import JitsiMeetView from '../views/JitsiMeetView';
import StatusView from '../views/StatusView';
import CreateDiscussionView from '../views/CreateDiscussionView';

// ChatsStackNavigator
const ChatsStack = createStackNavigator();
const ChatsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ChatsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<ChatsStack.Screen
				name='RoomsListView'
				component={RoomsListView}
			/>
			<ChatsStack.Screen
				name='RoomView'
				component={RoomView}
			/>
			<ChatsStack.Screen
				name='RoomActionsView'
				component={RoomActionsView}
				options={RoomActionsView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='RoomInfoView'
				component={RoomInfoView}
				options={RoomInfoView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='RoomInfoEditView'
				component={RoomInfoEditView}
				options={RoomInfoEditView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='RoomMembersView'
				component={RoomMembersView}
				options={RoomMembersView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='SearchMessagesView'
				component={SearchMessagesView}
				options={SearchMessagesView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='SelectedUsersView'
				component={SelectedUsersView}
			/>
			<ChatsStack.Screen
				name='InviteUsersView'
				component={InviteUsersView}
				options={InviteUsersView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='InviteUsersEditView'
				component={InviteUsersEditView}
				options={InviteUsersEditView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='MessagesView'
				component={MessagesView}
				options={MessagesView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='AutoTranslateView'
				component={AutoTranslateView}
				options={AutoTranslateView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='DirectoryView'
				component={DirectoryView}
				options={DirectoryView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='NotificationPrefView'
				component={NotificationPrefView}
				options={NotificationPrefView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='VisitorNavigationView'
				component={VisitorNavigationView}
				options={VisitorNavigationView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='ForwardLivechatView'
				component={ForwardLivechatView}
				options={ForwardLivechatView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='LivechatEditView'
				component={LivechatEditView}
				options={LivechatEditView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='PickerView'
				component={PickerView}
				options={PickerView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='ThreadMessagesView'
				component={ThreadMessagesView}
				options={ThreadMessagesView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='MarkdownTableView'
				component={MarkdownTableView}
				options={MarkdownTableView.navigationOptions}
			/>
			<ChatsStack.Screen
				name='ReadReceiptsView'
				component={ReadReceiptsView}
				options={ReadReceiptsView.navigationOptions}
			/>
		</ChatsStack.Navigator>
	);
};

// ProfileStackNavigator
const ProfileStack = createStackNavigator();
const ProfileStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ProfileStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<ProfileStack.Screen
				name='ProfileView'
				component={ProfileView}
				options={ProfileView.navigationOptions}
			/>
		</ProfileStack.Navigator>
	);
};

// SettingsStackNavigator
const SettingsStack = createStackNavigator();
const SettingsStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<SettingsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<SettingsStack.Screen
				name='SettingsView'
				component={SettingsView}
				options={SettingsView.navigationOptions}
			/>
			<SettingsStack.Screen
				name='LanguageView'
				component={LanguageView}
				options={LanguageView.navigationOptions}
			/>
			<SettingsStack.Screen
				name='ThemeView'
				component={ThemeView}
				options={ThemeView.navigationOptions}
			/>
			<SettingsStack.Screen
				name='DefaultBrowserView'
				component={DefaultBrowserView}
				options={DefaultBrowserView.navigationOptions}
			/>
			<SettingsStack.Screen
				name='ScreenLockConfigView'
				component={ScreenLockConfigView}
				options={ScreenLockConfigView.navigationOptions}
			/>
		</SettingsStack.Navigator>
	);
};

// AdminPanelStackNavigator
const AdminPanelStack = createStackNavigator();
const AdminPanelStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AdminPanelStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<AdminPanelStack.Screen
				name='AdminPanelView'
				component={AdminPanelView}
				options={AdminPanelView.navigationOptions}
			/>
		</AdminPanelStack.Navigator>
	);
};

// DrawerNavigator
const Drawer = createDrawerNavigator();
const DrawerNavigator = () => (
	<Drawer.Navigator
		drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}
		screenOptions={{ swipeEnabled: false }}
		drawerType='back'
	>
		<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
		<Drawer.Screen name='ProfileStackNavigator' component={ProfileStackNavigator} />
		<Drawer.Screen name='SettingsStackNavigator' component={SettingsStackNavigator} />
		<Drawer.Screen name='AdminPanelStackNavigator' component={AdminPanelStackNavigator} />
	</Drawer.Navigator>
);

// NewMessageStackNavigator
const NewMessageStack = createStackNavigator();
const NewMessageStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<NewMessageStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<NewMessageStack.Screen
				name='NewMessageView'
				component={NewMessageView}
				options={NewMessageView.navigationOptions}
			/>
			<NewMessageStack.Screen
				name='SelectedUsersViewCreateChannel'
				component={SelectedUsersView}
			/>
			<NewMessageStack.Screen
				name='CreateChannelView'
				component={CreateChannelView}
				options={CreateChannelView.navigationOptions}
			/>
			<NewMessageStack.Screen
				name='CreateDiscussionView'
				component={CreateDiscussionView}
			/>
		</NewMessageStack.Navigator>
	);
};

// InsideStackNavigator
const InsideStack = createStackNavigator();
const InsideStackNavigator = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...ModalAnimation }}>
			<InsideStack.Screen
				name='DrawerNavigator'
				component={DrawerNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='NewMessageStackNavigator'
				component={NewMessageStackNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='AttachmentView'
				component={AttachmentView}
			/>
			<InsideStack.Screen
				name='StatusView'
				component={StatusView}
			/>
			<InsideStack.Screen
				name='ModalBlockView'
				component={ModalBlockView}
				options={ModalBlockView.navigationOptions}
			/>
			<InsideStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{ headerShown: false }}
			/>
		</InsideStack.Navigator>
	);
};

export default InsideStackNavigator;

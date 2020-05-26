import React from 'react';
import PropTypes from 'prop-types';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../theme';
import { SplitContext } from '../split';
import {
	defaultHeader, themedHeader, modalAnimation, stackAnimation
} from '../utils/navigation';
import Toast from '../containers/Toast';
import Sidebar from '../views/SidebarView';
import NotificationBadge from '../notifications/inApp';

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

// InsideStackModal
import AttachmentView from '../views/AttachmentView';
import ModalBlockView from '../views/ModalBlockView';
import JitsiMeetView from '../views/JitsiMeetView';
import StatusView from '../views/StatusView';

// ChatsStack
const Chats = createStackNavigator();
const ChatsStack = () => {
	const { theme } = React.useContext(ThemeContext);
	const { split } = React.useContext(SplitContext);

	return (
		<Chats.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...stackAnimation }}>
			<Chats.Screen
				name='RoomsListView'
				component={RoomsListView}
				options={RoomsListView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomView'
				component={RoomView}
				options={props => RoomView.navigationOptions({ ...props, split, theme })}
			/>
			<Chats.Screen
				name='RoomActionsView'
				component={RoomActionsView}
				options={RoomActionsView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomInfoView'
				component={RoomInfoView}
				options={RoomInfoView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomInfoEditView'
				component={RoomInfoEditView}
				options={RoomInfoEditView.navigationOptions}
			/>
			<Chats.Screen
				name='RoomMembersView'
				component={RoomMembersView}
				options={RoomMembersView.navigationOptions}
			/>
			<Chats.Screen
				name='SearchMessagesView'
				component={SearchMessagesView}
				options={SearchMessagesView.navigationOptions}
			/>
			<Chats.Screen
				name='SelectedUsersView'
				component={SelectedUsersView}
				options={SelectedUsersView.navigationOptions}
			/>
			<Chats.Screen
				name='InviteUsersView'
				component={InviteUsersView}
				options={InviteUsersView.navigationOptions}
			/>
			<Chats.Screen
				name='InviteUsersEditView'
				component={InviteUsersEditView}
				options={InviteUsersEditView.navigationOptions}
			/>
			<Chats.Screen
				name='MessagesView'
				component={MessagesView}
				options={MessagesView.navigationOptions}
			/>
			<Chats.Screen
				name='AutoTranslateView'
				component={AutoTranslateView}
				options={AutoTranslateView.navigationOptions}
			/>
			<Chats.Screen
				name='DirectoryView'
				component={DirectoryView}
				options={props => DirectoryView.navigationOptions({ ...props, split })}
			/>
			<Chats.Screen
				name='NotificationPrefView'
				component={NotificationPrefView}
				options={NotificationPrefView.navigationOptions}
			/>
			<Chats.Screen
				name='ThreadMessagesView'
				component={ThreadMessagesView}
				options={ThreadMessagesView.navigationOptions}
			/>
			<Chats.Screen
				name='MarkdownTableView'
				component={MarkdownTableView}
				options={MarkdownTableView.navigationOptions}
			/>
			<Chats.Screen
				name='ReadReceiptsView'
				component={ReadReceiptsView}
				options={ReadReceiptsView.navigationOptions}
			/>
		</Chats.Navigator>
	);
};

// ProfileStack
const Profile = createStackNavigator();
const ProfileStack = () => {
	const { theme } = React.useContext(ThemeContext);
	const { split } = React.useContext(SplitContext);

	return (
		<Profile.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...stackAnimation }}>
			<Profile.Screen
				name='ProfileView'
				component={ProfileView}
				options={props => ProfileView.navigationOptions({ ...props, split })}
			/>
		</Profile.Navigator>
	);
};

// SettingsStack
const Settings = createStackNavigator();
const SettingsStack = () => {
	const { theme } = React.useContext(ThemeContext);
	const { split } = React.useContext(SplitContext);

	return (
		<Settings.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...stackAnimation }}>
			<Settings.Screen
				name='SettingsView'
				component={SettingsView}
				options={props => SettingsView.navigationOptions({ ...props, split })}
			/>
			<Settings.Screen
				name='LanguageView'
				component={LanguageView}
				options={LanguageView.navigationOptions}
			/>
			<Settings.Screen
				name='ThemeView'
				component={ThemeView}
				options={ThemeView.navigationOptions}
			/>
			<Settings.Screen
				name='DefaultBrowserView'
				component={DefaultBrowserView}
				options={DefaultBrowserView.navigationOptions}
			/>
			<Settings.Screen
				name='ScreenLockConfigView'
				component={ScreenLockConfigView}
				options={ScreenLockConfigView.navigationOptions}
			/>
		</Settings.Navigator>
	);
};

// AdminPanelStack
const AdminPanel = createStackNavigator();
const AdminPanelStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AdminPanel.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...stackAnimation }}>
			<AdminPanel.Screen
				name='AdminPanelView'
				component={AdminPanelView}
				options={AdminPanelView.navigationOptions}
			/>
		</AdminPanel.Navigator>
	);
};

// ChatsDrawer
const Drawer = createDrawerNavigator();
const ChatsDrawer = () => (
	<Drawer.Navigator drawerContent={({ navigation, state }) => <Sidebar navigation={navigation} state={state} />}>
		<Drawer.Screen name='ChatsStack' component={ChatsStack} />
		<Drawer.Screen name='ProfileStack' component={ProfileStack} />
		<Drawer.Screen name='SettingsStack' component={SettingsStack} />
		<Drawer.Screen name='AdminPanelStack' component={AdminPanelStack} />
	</Drawer.Navigator>
);

// NewMessageStack
const NewMessage = createStackNavigator();
const NewMessageStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<NewMessage.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...stackAnimation }}>
			<NewMessage.Screen
				name='NewMessageView'
				component={NewMessageView}
				options={NewMessageView.navigationOptions}
			/>
			<NewMessage.Screen
				name='SelectedUsersViewCreateChannel'
				component={SelectedUsersView}
				options={props => SelectedUsersView.navigationOptions({ ...props })}
			/>
			<NewMessage.Screen
				name='CreateChannelView'
				component={CreateChannelView}
				options={CreateChannelView.navigationOptions}
			/>
		</NewMessage.Navigator>
	);
};

// InsideStackModal
const InsideStack = createStackNavigator();
const InsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...modalAnimation }}>
			<InsideStack.Screen
				name='ChatsDrawer'
				component={ChatsDrawer}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='NewMessageStack'
				component={NewMessageStack}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='AttachmentView'
				component={AttachmentView}
				options={AttachmentView.navigationOptions}
			/>
			<InsideStack.Screen
				name='StatusView'
				component={StatusView}
				options={StatusView.navigationOptions}
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

const CustomInsideStack = ({ navigation, route }) => (
	<>
		<InsideStackModal navigation={navigation} />
		<NotificationBadge navigation={navigation} route={route} />
		<Toast />
	</>
);
CustomInsideStack.propTypes = {
	navigation: PropTypes.object,
	route: PropTypes.object
};

export default CustomInsideStack;

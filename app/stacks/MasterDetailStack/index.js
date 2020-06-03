import React from 'react';
import PropTypes from 'prop-types';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../../theme';
import {
	defaultHeader, themedHeader, StackAnimation, FadeFromCenterModal
} from '../../utils/navigation';
import Toast from '../../containers/Toast';
import NotificationBadge from '../../notifications/inApp';
import { ModalContainer } from './ModalContainer';

// Chats Stack
import RoomView from '../../views/RoomView';
import RoomsListView from '../../views/RoomsListView';
import RoomActionsView from '../../views/RoomActionsView';
import RoomInfoView from '../../views/RoomInfoView';
import RoomInfoEditView from '../../views/RoomInfoEditView';
import RoomMembersView from '../../views/RoomMembersView';
import SearchMessagesView from '../../views/SearchMessagesView';
import SelectedUsersView from '../../views/SelectedUsersView';
import InviteUsersView from '../../views/InviteUsersView';
import InviteUsersEditView from '../../views/InviteUsersEditView';
import MessagesView from '../../views/MessagesView';
import AutoTranslateView from '../../views/AutoTranslateView';
import DirectoryView from '../../views/DirectoryView';
import NotificationPrefView from '../../views/NotificationPreferencesView';
import VisitorNavigationView from '../../views/VisitorNavigationView';
import ForwardLivechatView from '../../views/ForwardLivechatView';
import LivechatEditView from '../../views/LivechatEditView';
import PickerView from '../../views/PickerView';
import ThreadMessagesView from '../../views/ThreadMessagesView';
import MarkdownTableView from '../../views/MarkdownTableView';
import ReadReceiptsView from '../../views/ReadReceiptView';

// Profile Stack
import ProfileView from '../../views/ProfileView';

// Settings Stack
import SettingsView from '../../views/SettingsView';
import LanguageView from '../../views/LanguageView';
import ThemeView from '../../views/ThemeView';
import DefaultBrowserView from '../../views/DefaultBrowserView';
import ScreenLockConfigView from '../../views/ScreenLockConfigView';

// Admin Stack
import AdminPanelView from '../../views/AdminPanelView';

// NewMessage Stack
import NewMessageView from '../../views/NewMessageView';
import CreateChannelView from '../../views/CreateChannelView';

// InsideStackModal
import AttachmentView from '../../views/AttachmentView';
import ModalBlockView from '../../views/ModalBlockView';
import JitsiMeetView from '../../views/JitsiMeetView';
import StatusView from '../../views/StatusView';
import CreateDiscussionView from '../../views/CreateDiscussionView';

// ChatsStack
const Chats = createStackNavigator();
const ChatsStack = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Chats.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Chats.Screen
				name='RoomView'
				component={RoomView}
				options={{ headerShown: false }}
			/>
		</Chats.Navigator>
	);
};

// ProfileStack
const Profile = createStackNavigator();
const ProfileStack = () => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<Profile.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<Profile.Screen
				name='ProfileView'
				component={ProfileView}
				// TODO:
				// options={props => ProfileView.navigationOptions({ ...props, split })}
			/>
		</Profile.Navigator>
	);
};

// SettingsStack
const Settings = createStackNavigator();
const SettingsStack = ({ navigation }) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation}>
			<Settings.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
				<Settings.Screen
					name='SettingsView'
					component={SettingsView}
					options={props => SettingsView.navigationOptions({ ...props, isMasterDetail: true })}
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
		</ModalContainer>
	);
};

// AdminPanelStack
const AdminPanel = createStackNavigator();
const AdminPanelStack = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<AdminPanel.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
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
	<Drawer.Navigator drawerContent={({ navigation, state }) => <RoomsListView navigation={navigation} state={state} />} drawerType='permanent'>
		<Drawer.Screen name='ChatsStack' component={ChatsStack} />
		{/* <Drawer.Screen name='ProfileStack' component={ProfileStack} />
		<Drawer.Screen name='SettingsStack' component={SettingsStack} />
		<Drawer.Screen name='AdminPanelStack' component={AdminPanelStack} /> */}
	</Drawer.Navigator>
);

// NewMessageStack
const NewMessage = createStackNavigator();
const NewMessageStack = ({ navigation }) => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<ModalContainer navigation={navigation}>
			<NewMessage.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
				<NewMessage.Screen
					name='NewMessageView'
					component={NewMessageView}
					options={NewMessageView.navigationOptions}
				/>
				<NewMessage.Screen
					name='SelectedUsersViewCreateChannel'
					component={SelectedUsersView}
				/>
				<NewMessage.Screen
					name='CreateChannelView'
					component={CreateChannelView}
					options={CreateChannelView.navigationOptions}
				/>
				<NewMessage.Screen
					name='CreateDiscussionView'
					component={CreateDiscussionView}
				/>
			</NewMessage.Navigator>
		</ModalContainer>
	);
};

const RoomStack = createStackNavigator();
const RoomStackModal = ({ navigation }) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation}>
			<RoomStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
				<RoomStack.Screen
					name='RoomActionsView'
					component={RoomActionsView}
					options={props => RoomActionsView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<RoomStack.Screen
					name='RoomInfoView'
					component={RoomInfoView}
					options={RoomInfoView.navigationOptions}
				/>
				<RoomStack.Screen
					name='RoomInfoEditView'
					component={RoomInfoEditView}
					options={RoomInfoEditView.navigationOptions}
				/>
				<RoomStack.Screen
					name='RoomMembersView'
					component={RoomMembersView}
					options={RoomMembersView.navigationOptions}
				/>
				<RoomStack.Screen
					name='SearchMessagesView'
					component={SearchMessagesView}
					options={SearchMessagesView.navigationOptions}
				/>
				<RoomStack.Screen
					name='SelectedUsersView'
					component={SelectedUsersView}
				/>
				<RoomStack.Screen
					name='InviteUsersView'
					component={InviteUsersView}
					options={InviteUsersView.navigationOptions}
				/>
				<RoomStack.Screen
					name='InviteUsersEditView'
					component={InviteUsersEditView}
					options={InviteUsersEditView.navigationOptions}
				/>
				<RoomStack.Screen
					name='MessagesView'
					component={MessagesView}
					options={MessagesView.navigationOptions}
				/>
				<RoomStack.Screen
					name='AutoTranslateView'
					component={AutoTranslateView}
					options={AutoTranslateView.navigationOptions}
				/>
				<RoomStack.Screen
					name='DirectoryView'
					component={DirectoryView}
					// TODO:
					// options={props => DirectoryView.navigationOptions({ ...props, split })}
				/>
				<RoomStack.Screen
					name='NotificationPrefView'
					component={NotificationPrefView}
					options={NotificationPrefView.navigationOptions}
				/>
				<RoomStack.Screen
					name='VisitorNavigationView'
					component={VisitorNavigationView}
					options={VisitorNavigationView.navigationOptions}
				/>
				<RoomStack.Screen
					name='ForwardLivechatView'
					component={ForwardLivechatView}
					options={ForwardLivechatView.navigationOptions}
				/>
				<RoomStack.Screen
					name='LivechatEditView'
					component={LivechatEditView}
					options={LivechatEditView.navigationOptions}
				/>
				<RoomStack.Screen
					name='PickerView'
					component={PickerView}
					options={PickerView.navigationOptions}
				/>
				<RoomStack.Screen
					name='ThreadMessagesView'
					component={ThreadMessagesView}
					options={ThreadMessagesView.navigationOptions}
				/>
				<RoomStack.Screen
					name='MarkdownTableView'
					component={MarkdownTableView}
					options={MarkdownTableView.navigationOptions}
				/>
				<RoomStack.Screen
					name='ReadReceiptsView'
					component={ReadReceiptsView}
					options={ReadReceiptsView.navigationOptions}
				/>
			</RoomStack.Navigator>
		</ModalContainer>
	);
};

// InsideStackModal
const InsideStack = createStackNavigator();
const InsideStackModal = () => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...FadeFromCenterModal }}>
			<InsideStack.Screen
				name='ChatsDrawer'
				component={ChatsDrawer}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='RoomStackModal'
				component={RoomStackModal}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='SettingsStack'
				component={SettingsStack}
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

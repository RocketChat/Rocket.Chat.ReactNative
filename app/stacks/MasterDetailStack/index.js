import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIsFocused } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../../theme';
import {
	defaultHeader, themedHeader, StackAnimation, FadeFromCenterModal
} from '../../utils/navigation';
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
import TeamChannelsView from '../../views/TeamChannelsView';
import MarkdownTableView from '../../views/MarkdownTableView';
import ReadReceiptsView from '../../views/ReadReceiptView';
import ProfileView from '../../views/ProfileView';
import SettingsView from '../../views/SettingsView';
import LanguageView from '../../views/LanguageView';
import ThemeView from '../../views/ThemeView';
import DefaultBrowserView from '../../views/DefaultBrowserView';
import ScreenLockConfigView from '../../views/ScreenLockConfigView';
import AdminPanelView from '../../views/AdminPanelView';
import NewMessageView from '../../views/NewMessageView';
import CreateChannelView from '../../views/CreateChannelView';
import UserPreferencesView from '../../views/UserPreferencesView';
import UserNotificationPrefView from '../../views/UserNotificationPreferencesView';
import SecurityPrivacyView from '../../views/SecurityPrivacyView';
import E2EEncryptionSecurityView from '../../views/E2EEncryptionSecurityView';

// InsideStackNavigator
import AttachmentView from '../../views/AttachmentView';
import ModalBlockView from '../../views/ModalBlockView';
import JitsiMeetView from '../../views/JitsiMeetView';
import StatusView from '../../views/StatusView';
import CreateDiscussionView from '../../views/CreateDiscussionView';
import E2ESaveYourPasswordView from '../../views/E2ESaveYourPasswordView';
import E2EHowItWorksView from '../../views/E2EHowItWorksView';
import E2EEnterYourPasswordView from '../../views/E2EEnterYourPasswordView';

import { setKeyCommands, deleteKeyCommands } from '../../commands';
import ShareView from '../../views/ShareView';

import QueueListView from '../../ee/omnichannel/views/QueueListView';
import AddChannelTeamView from '../../views/AddChannelTeamView';
import AddExistingChannelView from '../../views/AddExistingChannelView';
import SelectListView from '../../views/SelectListView';

// ChatsStackNavigator
const ChatsStack = createStackNavigator();
const ChatsStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);

	const isFocused = useIsFocused();
	useEffect(() => {
		if (isFocused) {
			setKeyCommands();
		} else {
			deleteKeyCommands();
		}
		return () => {
			deleteKeyCommands();
		};
	}, [isFocused]);

	return (
		<ChatsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
			<ChatsStack.Screen
				name='RoomView'
				component={RoomView}
				options={{ headerShown: false }}
			/>
		</ChatsStack.Navigator>
	);
});

// DrawerNavigator
const Drawer = createDrawerNavigator();
const DrawerNavigator = React.memo(() => (
	<Drawer.Navigator
		drawerContent={({ navigation, state }) => <RoomsListView navigation={navigation} state={state} />}
		drawerType='permanent'
	>
		<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
	</Drawer.Navigator>
));

const ModalStack = createStackNavigator();
const ModalStackNavigator = React.memo(({ navigation }) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation} theme={theme}>
			<ModalStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation }}>
				<ModalStack.Screen
					name='RoomActionsView'
					component={RoomActionsView}
					options={props => RoomActionsView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='RoomInfoView'
					component={RoomInfoView}
					options={RoomInfoView.navigationOptions}
				/>
				<ModalStack.Screen
					name='SelectListView'
					component={SelectListView}
					options={SelectListView.navigationOptions}
				/>
				<ModalStack.Screen
					name='RoomInfoEditView'
					component={RoomInfoEditView}
					options={RoomInfoEditView.navigationOptions}
				/>
				<ModalStack.Screen
					name='RoomMembersView'
					component={RoomMembersView}
					options={RoomMembersView.navigationOptions}
				/>
				<ModalStack.Screen
					name='SearchMessagesView'
					component={SearchMessagesView}
					options={SearchMessagesView.navigationOptions}
				/>
				<ModalStack.Screen
					name='SelectedUsersView'
					component={SelectedUsersView}
				/>
				<ModalStack.Screen
					name='InviteUsersView'
					component={InviteUsersView}
					options={InviteUsersView.navigationOptions}
				/>
				<ModalStack.Screen
					name='AddChannelTeamView'
					component={AddChannelTeamView}
					options={AddChannelTeamView.navigationOptions}
				/>
				<ModalStack.Screen
					name='AddExistingChannelView'
					component={AddExistingChannelView}
					options={AddExistingChannelView.navigationOptions}
				/>
				<ModalStack.Screen
					name='InviteUsersEditView'
					component={InviteUsersEditView}
					options={InviteUsersEditView.navigationOptions}
				/>
				<ModalStack.Screen
					name='MessagesView'
					component={MessagesView}
				/>
				<ModalStack.Screen
					name='AutoTranslateView'
					component={AutoTranslateView}
					options={AutoTranslateView.navigationOptions}
				/>
				<ModalStack.Screen
					name='DirectoryView'
					component={DirectoryView}
					options={props => DirectoryView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='QueueListView'
					component={QueueListView}
					options={props => QueueListView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='NotificationPrefView'
					component={NotificationPrefView}
					options={NotificationPrefView.navigationOptions}
				/>
				<ModalStack.Screen
					name='VisitorNavigationView'
					component={VisitorNavigationView}
					options={VisitorNavigationView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ForwardLivechatView'
					component={ForwardLivechatView}
					options={ForwardLivechatView.navigationOptions}
				/>
				<ModalStack.Screen
					name='LivechatEditView'
					component={LivechatEditView}
					options={LivechatEditView.navigationOptions}
				/>
				<ModalStack.Screen
					name='PickerView'
					component={PickerView}
					options={PickerView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ThreadMessagesView'
					component={ThreadMessagesView}
				/>
				<ModalStack.Screen
					name='TeamChannelsView'
					component={TeamChannelsView}
					options={TeamChannelsView.navigationOptions}
				/>
				<ModalStack.Screen
					name='MarkdownTableView'
					component={MarkdownTableView}
					options={MarkdownTableView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ReadReceiptsView'
					component={ReadReceiptsView}
					options={props => ReadReceiptsView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='SettingsView'
					component={SettingsView}
					options={props => SettingsView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='LanguageView'
					component={LanguageView}
					options={LanguageView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ThemeView'
					component={ThemeView}
					options={ThemeView.navigationOptions}
				/>
				<ModalStack.Screen
					name='DefaultBrowserView'
					component={DefaultBrowserView}
					options={DefaultBrowserView.navigationOptions}
				/>
				<ModalStack.Screen
					name='ScreenLockConfigView'
					component={ScreenLockConfigView}
					options={ScreenLockConfigView.navigationOptions}
				/>
				<ModalStack.Screen
					name='StatusView'
					component={StatusView}
				/>
				<ModalStack.Screen
					name='ProfileView'
					component={ProfileView}
					options={props => ProfileView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='AdminPanelView'
					component={AdminPanelView}
					options={props => AdminPanelView.navigationOptions({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen
					name='NewMessageView'
					component={NewMessageView}
					options={NewMessageView.navigationOptions}
				/>
				<ModalStack.Screen
					name='SelectedUsersViewCreateChannel'
					component={SelectedUsersView}
				/>
				<ModalStack.Screen
					name='CreateChannelView'
					component={CreateChannelView}
					options={CreateChannelView.navigationOptions}
				/>
				<ModalStack.Screen
					name='CreateDiscussionView'
					component={CreateDiscussionView}
				/>
				<ModalStack.Screen
					name='E2ESaveYourPasswordView'
					component={E2ESaveYourPasswordView}
					options={E2ESaveYourPasswordView.navigationOptions}
				/>
				<ModalStack.Screen
					name='E2EHowItWorksView'
					component={E2EHowItWorksView}
					options={E2EHowItWorksView.navigationOptions}
				/>
				<ModalStack.Screen
					name='E2EEnterYourPasswordView'
					component={E2EEnterYourPasswordView}
					options={E2EEnterYourPasswordView.navigationOptions}
				/>
				<ModalStack.Screen
					name='UserPreferencesView'
					component={UserPreferencesView}
					options={UserPreferencesView.navigationOptions}
				/>
				<ModalStack.Screen
					name='UserNotificationPrefView'
					component={UserNotificationPrefView}
					options={UserNotificationPrefView.navigationOptions}
				/>
				<ModalStack.Screen
					name='SecurityPrivacyView'
					component={SecurityPrivacyView}
					options={SecurityPrivacyView.navigationOptions}
				/>
				<ModalStack.Screen
					name='E2EEncryptionSecurityView'
					component={E2EEncryptionSecurityView}
					options={E2EEncryptionSecurityView.navigationOptions}
				/>
			</ModalStack.Navigator>
		</ModalContainer>
	);
});

ModalStackNavigator.propTypes = {
	navigation: PropTypes.object
};

// InsideStackNavigator
const InsideStack = createStackNavigator();
const InsideStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<InsideStack.Navigator mode='modal' screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...FadeFromCenterModal }}>
			<InsideStack.Screen
				name='DrawerNavigator'
				component={DrawerNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='ModalStackNavigator'
				component={ModalStackNavigator}
				options={{ headerShown: false }}
			/>
			<InsideStack.Screen
				name='AttachmentView'
				component={AttachmentView}
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
			<InsideStack.Screen
				name='ShareView'
				component={ShareView}
			/>
		</InsideStack.Navigator>
	);
});

export default InsideStackNavigator;

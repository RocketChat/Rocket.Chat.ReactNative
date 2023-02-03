import React, { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../../theme';
import {
	FadeFromCenterModal,
	StackAnimation,
	defaultHeader,
	themedHeader,
	drawerStyle
} from '../../lib/methods/helpers/navigation';
// Chats Stack
import RoomView from '../../views/RoomView';
import RoomsListView from '../../views/RoomsListView';
import RoomActionsView from '../../views/RoomActionsView';
import RoomInfoView from '../../views/RoomInfoView';
import RoomInfoEditView from '../../views/RoomInfoEditView';
import ChangeAvatarView from '../../views/ChangeAvatarView';
import RoomMembersView from '../../views/RoomMembersView';
import SearchMessagesView from '../../views/SearchMessagesView';
import SelectedUsersView from '../../views/SelectedUsersView';
import InviteUsersView from '../../views/InviteUsersView';
import InviteUsersEditView from '../../views/InviteUsersEditView';
import MessagesView from '../../views/MessagesView';
import AutoTranslateView from '../../views/AutoTranslateView';
import DirectoryView from '../../views/DirectoryView';
import NotificationPrefView from '../../views/NotificationPreferencesView';
import ForwardLivechatView from '../../views/ForwardLivechatView';
import CloseLivechatView from '../../views/CloseLivechatView';
import CannedResponsesListView from '../../views/CannedResponsesListView';
import CannedResponseDetail from '../../views/CannedResponseDetail';
import LivechatEditView from '../../views/LivechatEditView';
import PickerView from '../../views/PickerView';
import ThreadMessagesView from '../../views/ThreadMessagesView';
import TeamChannelsView from '../../views/TeamChannelsView';
import MarkdownTableView from '../../views/MarkdownTableView';
import ReadReceiptsView from '../../views/ReadReceiptView';
import ProfileView from '../../views/ProfileView';
import DisplayPrefsView from '../../views/DisplayPrefsView';
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
import { deleteKeyCommands, setKeyCommands } from '../../commands';
import ShareView from '../../views/ShareView';
import QueueListView from '../../ee/omnichannel/views/QueueListView';
import AddChannelTeamView from '../../views/AddChannelTeamView';
import AddExistingChannelView from '../../views/AddExistingChannelView';
import SelectListView from '../../views/SelectListView';
import DiscussionsView from '../../views/DiscussionsView';
import { ModalContainer } from './ModalContainer';
import {
	MasterDetailChatsStackParamList,
	MasterDetailDrawerParamList,
	MasterDetailInsideStackParamList,
	ModalStackParamList
} from './types';
import { isIOS } from '../../lib/methods/helpers';

// ChatsStackNavigator
const ChatsStack = createStackNavigator<MasterDetailChatsStackParamList>();
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
		<ChatsStack.Navigator
			screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
		>
			<ChatsStack.Screen name='RoomView' component={RoomView} options={{ headerShown: false }} />
		</ChatsStack.Navigator>
	);
});

// DrawerNavigator
const Drawer = createDrawerNavigator<MasterDetailDrawerParamList>();
const DrawerNavigator = React.memo(() => (
	<Drawer.Navigator
		screenOptions={{ drawerType: 'permanent', headerShown: false, drawerStyle: { ...drawerStyle } }}
		drawerContent={({ navigation, state }) => <RoomsListView navigation={navigation} state={state} />}
	>
		<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
	</Drawer.Navigator>
));

export interface INavigation {
	navigation: StackNavigationProp<ModalStackParamList>;
}

const ModalStack = createStackNavigator<ModalStackParamList>();
const ModalStackNavigator = React.memo(({ navigation }: INavigation) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation} theme={theme}>
			<ModalStack.Navigator
				screenOptions={{ ...defaultHeader, ...themedHeader(theme), ...StackAnimation } as StackNavigationOptions}
			>
				<ModalStack.Screen name='RoomActionsView' component={RoomActionsView} />
				<ModalStack.Screen name='RoomInfoView' component={RoomInfoView} options={RoomInfoView.navigationOptions} />
				<ModalStack.Screen name='SelectListView' component={SelectListView} />
				<ModalStack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
				<ModalStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
				<ModalStack.Screen name='RoomMembersView' component={RoomMembersView} />
				<ModalStack.Screen
					name='SearchMessagesView'
					component={SearchMessagesView}
					options={SearchMessagesView.navigationOptions}
				/>
				<ModalStack.Screen name='SelectedUsersView' component={SelectedUsersView} />
				<ModalStack.Screen name='InviteUsersView' component={InviteUsersView} />
				<ModalStack.Screen name='AddChannelTeamView' component={AddChannelTeamView} />
				<ModalStack.Screen
					name='AddExistingChannelView'
					component={AddExistingChannelView}
					options={AddExistingChannelView.navigationOptions}
				/>
				<ModalStack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
				<ModalStack.Screen name='MessagesView' component={MessagesView} />
				<ModalStack.Screen name='AutoTranslateView' component={AutoTranslateView} options={AutoTranslateView.navigationOptions} />
				<ModalStack.Screen
					name='DirectoryView'
					component={DirectoryView}
					options={props => DirectoryView.navigationOptions!({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen name='QueueListView' component={QueueListView} />
				<ModalStack.Screen name='NotificationPrefView' component={NotificationPrefView} />
				<ModalStack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
				<ModalStack.Screen name='CloseLivechatView' component={CloseLivechatView} />
				<ModalStack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
				<ModalStack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
				<ModalStack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
				<ModalStack.Screen name='PickerView' component={PickerView} options={PickerView.navigationOptions} />
				<ModalStack.Screen name='ThreadMessagesView' component={ThreadMessagesView} />
				<ModalStack.Screen name='DiscussionsView' component={DiscussionsView} />
				<ModalStack.Screen name='TeamChannelsView' component={TeamChannelsView} options={TeamChannelsView.navigationOptions} />
				<ModalStack.Screen name='MarkdownTableView' component={MarkdownTableView} />
				<ModalStack.Screen
					name='ReadReceiptsView'
					component={ReadReceiptsView}
					options={props => ReadReceiptsView.navigationOptions!({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen name='SettingsView' component={SettingsView} />
				<ModalStack.Screen name='LanguageView' component={LanguageView} />
				<ModalStack.Screen name='ThemeView' component={ThemeView} />
				<ModalStack.Screen name='DefaultBrowserView' component={DefaultBrowserView} />
				<ModalStack.Screen
					name='ScreenLockConfigView'
					component={ScreenLockConfigView}
					options={ScreenLockConfigView.navigationOptions}
				/>
				<ModalStack.Screen name='StatusView' component={StatusView} />
				<ModalStack.Screen name='ProfileView' component={ProfileView} />
				<ModalStack.Screen name='DisplayPrefsView' component={DisplayPrefsView} />
				<ModalStack.Screen name='AdminPanelView' component={AdminPanelView} />
				<ModalStack.Screen name='NewMessageView' component={NewMessageView} />
				<ModalStack.Screen name='SelectedUsersViewCreateChannel' component={SelectedUsersView} />
				<ModalStack.Screen name='CreateChannelView' component={CreateChannelView} />
				<ModalStack.Screen name='CreateDiscussionView' component={CreateDiscussionView} />
				<ModalStack.Screen name='E2ESaveYourPasswordView' component={E2ESaveYourPasswordView} />
				<ModalStack.Screen name='E2EHowItWorksView' component={E2EHowItWorksView} />
				<ModalStack.Screen name='E2EEnterYourPasswordView' component={E2EEnterYourPasswordView} />
				<ModalStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
				<ModalStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
				<ModalStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
				<ModalStack.Screen
					name='E2EEncryptionSecurityView'
					component={E2EEncryptionSecurityView}
					options={E2EEncryptionSecurityView.navigationOptions}
				/>
			</ModalStack.Navigator>
		</ModalContainer>
	);
});

// InsideStackNavigator
const InsideStack = createStackNavigator<MasterDetailInsideStackParamList>();
const InsideStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<InsideStack.Navigator
			screenOptions={
				{
					...defaultHeader,
					...themedHeader(theme),
					...FadeFromCenterModal,
					presentation: 'transparentModal'
				} as StackNavigationOptions
			}
		>
			<InsideStack.Screen name='DrawerNavigator' component={DrawerNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen name='ModalStackNavigator' component={ModalStackNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen name='AttachmentView' component={AttachmentView} />
			<InsideStack.Screen name='ModalBlockView' component={ModalBlockView} options={ModalBlockView.navigationOptions} />
			<InsideStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{ headerShown: false, animationEnabled: isIOS }}
			/>
			<InsideStack.Screen name='ShareView' component={ShareView} />
		</InsideStack.Navigator>
	);
});

export default InsideStackNavigator;

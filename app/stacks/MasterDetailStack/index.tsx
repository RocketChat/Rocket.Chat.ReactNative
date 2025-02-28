import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { ThemeContext } from '../../theme';
import { defaultHeader, themedHeader, drawerStyle } from '../../lib/methods/helpers/navigation';
// Chats Stack
import RoomView from '../../views/RoomView';
import RoomsListView from '../../views/RoomsListView';
import RoomActionsView from '../../views/RoomActionsView';
import RoomInfoView from '../../views/RoomInfoView';
import ReportUserView from '../../views/ReportUserView';
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
import E2EEToggleRoomView from '../../views/E2EEToggleRoomView';
import PushTroubleshootView from '../../views/PushTroubleshootView';
import ForwardLivechatView from '../../views/ForwardLivechatView';
import ForwardMessageView from '../../views/ForwardMessageView';
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
import LegalView from '../../views/LegalView';
import SecurityPrivacyView from '../../views/SecurityPrivacyView';
import MediaAutoDownloadView from '../../views/MediaAutoDownloadView';
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
import { TNavigation } from '../stackType';
import { SupportedVersionsWarning } from '../../containers/SupportedVersions';

// ChatsStackNavigator
const ChatsStack = createNativeStackNavigator<MasterDetailChatsStackParamList>();
const ChatsStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);

	return (
		<ChatsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<ChatsStack.Screen name='RoomView' component={RoomView} options={{ title: '' }} />
		</ChatsStack.Navigator>
	);
});

// DrawerNavigator
const Drawer = createDrawerNavigator<MasterDetailDrawerParamList>();
const DrawerNavigator = React.memo(() => (
	<Drawer.Navigator
		screenOptions={{ drawerType: 'permanent', headerShown: false, drawerStyle: { ...drawerStyle } }}
		drawerContent={({ navigation, state }) => <RoomsListView navigation={navigation} state={state} />}>
		<Drawer.Screen name='ChatsStackNavigator' component={ChatsStackNavigator} />
	</Drawer.Navigator>
));

export interface INavigation {
	navigation: NativeStackNavigationProp<ModalStackParamList>;
}

const ModalStack = createNativeStackNavigator<ModalStackParamList & TNavigation>();
const ModalStackNavigator = React.memo(({ navigation }: INavigation) => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<ModalContainer navigation={navigation} theme={theme}>
			<ModalStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
				<ModalStack.Screen
					name='RoomActionsView'
					component={RoomActionsView}
					options={props => RoomActionsView.navigationOptions!({ ...props, isMasterDetail: true })}
				/>
				{/* @ts-ignore */}
				<ModalStack.Screen name='RoomInfoView' component={RoomInfoView} />
				<ModalStack.Screen name='ReportUserView' component={ReportUserView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='SelectListView' component={SelectListView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
				<ModalStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
				<ModalStack.Screen name='RoomMembersView' component={RoomMembersView} />
				<ModalStack.Screen
					name='SearchMessagesView'
					// @ts-ignore
					component={SearchMessagesView}
					options={SearchMessagesView.navigationOptions}
				/>
				<ModalStack.Screen name='SelectedUsersView' component={SelectedUsersView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='InviteUsersView' component={InviteUsersView} />
				<ModalStack.Screen name='AddChannelTeamView' component={AddChannelTeamView} />
				<ModalStack.Screen name='AddExistingChannelView' component={AddExistingChannelView} />
				<ModalStack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
				<ModalStack.Screen name='MessagesView' component={MessagesView} />
				<ModalStack.Screen name='AutoTranslateView' component={AutoTranslateView} />
				<ModalStack.Screen
					name='DirectoryView'
					// @ts-ignore
					component={DirectoryView}
				/>
				<ModalStack.Screen name='QueueListView' component={QueueListView} />
				<ModalStack.Screen name='NotificationPrefView' component={NotificationPrefView} />
				<ModalStack.Screen name='E2EEToggleRoomView' component={E2EEToggleRoomView} />
				<ModalStack.Screen name='ForwardMessageView' component={ForwardMessageView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='CloseLivechatView' component={CloseLivechatView} />
				<ModalStack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
				<ModalStack.Screen name='PickerView' component={PickerView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='ThreadMessagesView' component={ThreadMessagesView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='DiscussionsView' component={DiscussionsView} />
				<ModalStack.Screen name='TeamChannelsView' component={TeamChannelsView} options={TeamChannelsView.navigationOptions} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='MarkdownTableView' component={MarkdownTableView} />
				<ModalStack.Screen
					name='ReadReceiptsView'
					// @ts-ignore
					component={ReadReceiptsView}
					options={props => ReadReceiptsView.navigationOptions!({ ...props, isMasterDetail: true })}
				/>
				<ModalStack.Screen name='SettingsView' component={SettingsView} />
				{/* @ts-ignore */}
				<ModalStack.Screen name='LegalView' component={LegalView} />
				<ModalStack.Screen name='LanguageView' component={LanguageView} />
				<ModalStack.Screen name='ThemeView' component={ThemeView} />
				<ModalStack.Screen name='DefaultBrowserView' component={DefaultBrowserView} />
				<ModalStack.Screen
					name='ScreenLockConfigView'
					// @ts-ignore
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
				{/* @ts-ignore */}
				<ModalStack.Screen name='CreateDiscussionView' component={CreateDiscussionView} />
				<ModalStack.Screen name='E2ESaveYourPasswordView' component={E2ESaveYourPasswordView} />
				<ModalStack.Screen name='E2EHowItWorksView' component={E2EHowItWorksView} />
				<ModalStack.Screen name='E2EEnterYourPasswordView' component={E2EEnterYourPasswordView} />
				<ModalStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
				<ModalStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
				<ModalStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
				<ModalStack.Screen name='MediaAutoDownloadView' component={MediaAutoDownloadView} />
				<ModalStack.Screen name='E2EEncryptionSecurityView' component={E2EEncryptionSecurityView} />
				<ModalStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
				<ModalStack.Screen name='SupportedVersionsWarning' component={SupportedVersionsWarning} />
			</ModalStack.Navigator>
		</ModalContainer>
	);
});

// InsideStackNavigator
const InsideStack = createNativeStackNavigator<MasterDetailInsideStackParamList & TNavigation>();
const InsideStackNavigator = React.memo(() => {
	const { theme } = React.useContext(ThemeContext);
	return (
		<InsideStack.Navigator
			screenOptions={{
				...defaultHeader,
				...themedHeader(theme),
				presentation: 'containedTransparentModal'
			}}>
			<InsideStack.Screen name='DrawerNavigator' component={DrawerNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen name='ModalStackNavigator' component={ModalStackNavigator} options={{ headerShown: false }} />
			<InsideStack.Screen name='AttachmentView' component={AttachmentView} />
			{/* @ts-ignore */}
			<InsideStack.Screen name='ModalBlockView' component={ModalBlockView} options={ModalBlockView.navigationOptions} />
			<InsideStack.Screen
				name='JitsiMeetView'
				component={JitsiMeetView}
				options={{
					headerShown: false,
					animation: isIOS ? 'default' : 'none'
				}}
			/>
			{/* @ts-ignore */}
			<InsideStack.Screen name='ShareView' component={ShareView} />
		</InsideStack.Navigator>
	);
});

export default InsideStackNavigator;

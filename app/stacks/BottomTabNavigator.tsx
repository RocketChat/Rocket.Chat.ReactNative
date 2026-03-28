import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
// Chat screens
import RoomsListView from '../views/RoomsListView';
import RoomView from '../views/RoomView';
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
import ReadReceiptsView from '../views/ReadReceiptView';
import CannedResponsesListView from '../views/CannedResponsesListView';
import CannedResponseDetail from '../views/CannedResponseDetail';
import DiscussionsView from '../views/DiscussionsView';
import ChangeAvatarView from '../views/ChangeAvatarView';
import AddChannelTeamView from '../views/AddChannelTeamView';
import AddExistingChannelView from '../views/AddExistingChannelView';
import SelectListView from '../views/SelectListView';
import QueueListView from '../ee/omnichannel/views/QueueListView';
import JitsiMeetView from '../views/JitsiMeetView';
import CreateChannelView from '../views/CreateChannelView';
import PushTroubleshootView from '../views/PushTroubleshootView';
// Search
import SearchView from '../views/SearchView';
// More tab screens
import MoreView from '../views/MoreView';
import ProfileView from '../views/ProfileView';
import UserPreferencesView from '../views/UserPreferencesView';
import UserNotificationPrefView from '../views/UserNotificationPreferencesView';
import ChangePasswordView from '../views/ChangePasswordView';
import SettingsView from '../views/SettingsView';
import SecurityPrivacyView from '../views/SecurityPrivacyView';
import GetHelpView from '../views/GetHelpView';
import E2EEncryptionSecurityView from '../views/E2EEncryptionSecurityView';
import LanguageView from '../views/LanguageView';
import ThemeView from '../views/ThemeView';
import DefaultBrowserView from '../views/DefaultBrowserView';
import ScreenLockConfigView from '../views/ScreenLockConfigView';
import MediaAutoDownloadView from '../views/MediaAutoDownloadView';
import AdminPanelView from '../views/AdminPanelView';
import AccessibilityAndAppearanceView from '../views/AccessibilityAndAppearanceView';
import DisplayPrefsView from '../views/DisplayPrefsView';
import LegalView from '../views/LegalView';
import { isIOS } from '../lib/methods/helpers';
import { type TNavigation } from './stackType';
import i18n from '../i18n';
import { type BottomTabParamList, type ChatsStackParamList, type MoreStackParamList, type SearchStackParamList } from './types';

const renderChatScreens = (Stack: any) => (
	<>
		<Stack.Screen name='RoomView' component={RoomView} />
		<Stack.Screen name='RoomActionsView' component={RoomActionsView} options={RoomActionsView.navigationOptions} />
		{/* @ts-ignore */}
		<Stack.Screen name='SelectListView' component={SelectListView} options={SelectListView.navigationOptions} />
		<Stack.Screen name='RoomInfoView' component={RoomInfoView} />
		<Stack.Screen name='ReportUserView' component={ReportUserView} />
		{/* @ts-ignore */}
		<Stack.Screen name='RoomInfoEditView' component={RoomInfoEditView} options={RoomInfoEditView.navigationOptions} />
		<Stack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
		<Stack.Screen name='RoomMembersView' component={RoomMembersView} />
		{/* @ts-ignore */}
		<Stack.Screen name='DiscussionsView' component={DiscussionsView} />
		<Stack.Screen
			name='SearchMessagesView'
			// @ts-ignore
			component={SearchMessagesView}
			options={SearchMessagesView.navigationOptions}
		/>
		<Stack.Screen name='SelectedUsersView' component={SelectedUsersView} />
		{/* @ts-ignore */}
		<Stack.Screen name='InviteUsersView' component={InviteUsersView} />
		<Stack.Screen name='InviteUsersEditView' component={InviteUsersEditView} />
		<Stack.Screen name='MessagesView' component={MessagesView} />
		<Stack.Screen name='AutoTranslateView' component={AutoTranslateView} />
		{/* @ts-ignore */}
		<Stack.Screen name='DirectoryView' component={DirectoryView} options={DirectoryView.navigationOptions} />
		<Stack.Screen name='NotificationPrefView' component={NotificationPrefView} />
		<Stack.Screen name='E2EEToggleRoomView' component={E2EEToggleRoomView} />
		<Stack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
		<Stack.Screen name='ForwardLivechatView' component={ForwardLivechatView} />
		{/* @ts-ignore */}
		<Stack.Screen name='CloseLivechatView' component={CloseLivechatView} />
		{/* @ts-ignore */}
		<Stack.Screen name='LivechatEditView' component={LivechatEditView} options={LivechatEditView.navigationOptions} />
		<Stack.Screen name='PickerView' component={PickerView} />
		{/* @ts-ignore */}
		<Stack.Screen name='ThreadMessagesView' component={ThreadMessagesView} />
		<Stack.Screen name='TeamChannelsView' component={TeamChannelsView} />
		<Stack.Screen name='CreateChannelView' component={CreateChannelView} />
		<Stack.Screen name='AddChannelTeamView' component={AddChannelTeamView} />
		<Stack.Screen name='AddExistingChannelView' component={AddExistingChannelView} />
		{/* @ts-ignore */}
		<Stack.Screen name='ReadReceiptsView' component={ReadReceiptsView} options={ReadReceiptsView.navigationOptions} />
		<Stack.Screen name='QueueListView' component={QueueListView} />
		<Stack.Screen name='CannedResponsesListView' component={CannedResponsesListView} />
		<Stack.Screen name='CannedResponseDetail' component={CannedResponseDetail} />
		<Stack.Screen
			name='JitsiMeetView'
			component={JitsiMeetView}
			options={{
				headerShown: false,
				animation: isIOS ? 'default' : 'none'
			}}
		/>
	</>
);

const HomeStack = createNativeStackNavigator<ChatsStackParamList & TNavigation>();
const HomeStackScreen = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);
	return (
		<HomeStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<HomeStack.Screen name='RoomsListView' component={RoomsListView} initialParams={{ roomFilter: 'home' }} />
			{renderChatScreens(HomeStack)}
		</HomeStack.Navigator>
	);
};

const DiscussionsStack = createNativeStackNavigator<ChatsStackParamList & TNavigation>();
const DiscussionsStackScreen = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);
	return (
		<DiscussionsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<DiscussionsStack.Screen name='RoomsListView' component={RoomsListView} initialParams={{ roomFilter: 'discussions' }} />
			{renderChatScreens(DiscussionsStack)}
		</DiscussionsStack.Navigator>
	);
};

const DMsStack = createNativeStackNavigator<ChatsStackParamList & TNavigation>();
const DMsStackScreen = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);
	return (
		<DMsStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<DMsStack.Screen name='RoomsListView' component={RoomsListView} initialParams={{ roomFilter: 'dms' }} />
			{renderChatScreens(DMsStack)}
		</DMsStack.Navigator>
	);
};

const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
const SearchStackScreen = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);
	return (
		<SearchStackNav.Navigator
			screenOptions={{
				...themedHeader(theme),
				headerLargeTitle: true
			}}>
			<SearchStackNav.Screen name='SearchView' component={SearchView} options={{ title: i18n.t('Search') }} />
		</SearchStackNav.Navigator>
	);
};

const MoreStack = createNativeStackNavigator<MoreStackParamList & TNavigation>();
const MoreStackScreen = () => {
	'use memo';

	const { theme } = React.useContext(ThemeContext);
	return (
		<MoreStack.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<MoreStack.Screen name='MoreView' component={MoreView} />
			<MoreStack.Screen name='ProfileView' component={ProfileView} />
			<MoreStack.Screen name='ChangePasswordView' component={ChangePasswordView} />
			<MoreStack.Screen name='UserPreferencesView' component={UserPreferencesView} />
			<MoreStack.Screen name='ChangeAvatarView' component={ChangeAvatarView} />
			<MoreStack.Screen name='UserNotificationPrefView' component={UserNotificationPrefView} />
			<MoreStack.Screen name='PushTroubleshootView' component={PushTroubleshootView} />
			<MoreStack.Screen name='PickerView' component={PickerView} />
			<MoreStack.Screen name='SettingsView' component={SettingsView} />
			<MoreStack.Screen name='SecurityPrivacyView' component={SecurityPrivacyView} />
			<MoreStack.Screen name='E2EEncryptionSecurityView' component={E2EEncryptionSecurityView} />
			<MoreStack.Screen name='LanguageView' component={LanguageView} />
			<MoreStack.Screen name='DefaultBrowserView' component={DefaultBrowserView} />
			<MoreStack.Screen name='MediaAutoDownloadView' component={MediaAutoDownloadView} />
			<MoreStack.Screen name='GetHelpView' component={GetHelpView} />
			{/* @ts-ignore */}
			<MoreStack.Screen name='LegalView' component={LegalView} />
			<MoreStack.Screen
				name='ScreenLockConfigView'
				// @ts-ignore
				component={ScreenLockConfigView}
				options={ScreenLockConfigView.navigationOptions}
			/>
			<MoreStack.Screen name='AccessibilityAndAppearanceView' component={AccessibilityAndAppearanceView} />
			<MoreStack.Screen name='DisplayPrefsView' component={DisplayPrefsView} />
			<MoreStack.Screen name='ThemeView' component={ThemeView} />
			<MoreStack.Screen name='AdminPanelView' component={AdminPanelView} />
		</MoreStack.Navigator>
	);
};

const Tab = createNativeBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
	'use memo';

	return (
		<Tab.Navigator
			sidebarAdaptable
			ignoresTopSafeArea
			// @ts-expect-error — headerShown is supported at runtime but missing from type defs
			screenOptions={{ headerShown: false }}>
			<Tab.Screen
				name='HomeStack'
				component={HomeStackScreen}
				options={{
					title: i18n.t('Chats'),
					tabBarIcon: () => ({ sfSymbol: 'house.fill' })
				}}
			/>
			<Tab.Screen
				name='DiscussionsStack'
				component={DiscussionsStackScreen}
				options={{
					title: i18n.t('Discussions'),
					tabBarIcon: () => ({ sfSymbol: 'bubble.left.and.bubble.right.fill' })
				}}
			/>
			<Tab.Screen
				name='DMsStack'
				component={DMsStackScreen}
				options={{
					title: i18n.t('Direct_Messages'),
					tabBarIcon: () => ({ sfSymbol: 'envelope.fill' })
				}}
			/>
			<Tab.Screen
				name='SearchStack'
				component={SearchStackScreen}
				options={{
					title: i18n.t('Search'),
					role: 'search',
					tabBarIcon: () => ({ sfSymbol: 'magnifyingglass' })
				}}
			/>
			<Tab.Screen
				name='MoreStack'
				component={MoreStackScreen}
				options={{
					title: i18n.t('More'),
					tabBarIcon: () => ({ sfSymbol: 'ellipsis' })
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;

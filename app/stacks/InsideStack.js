import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { defaultHeader, themedHeader } from '../utils/navigation';

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

// ChatsStack
const Chats = createStackNavigator();
const ChatsStack = () => (
	<Chats.Navigator screenOptions={{ ...defaultHeader, ...themedHeader('light') }}>
		<Chats.Screen
			name='RoomsListView'
			component={RoomsListView}
			options={RoomsListView.navigationOptions}
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
			options={DirectoryView.navigationOptions}
		/>
		<Chats.Screen
			name='NotificationPreferencesView'
			component={NotificationPrefView}
			options={NotificationPrefView.navigationOptions}
		/>
		<Chats.Screen
			name='RoomView'
			component={RoomView}
			options={RoomView.navigationOptions}
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

export default ChatsStack;

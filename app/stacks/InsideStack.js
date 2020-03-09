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
		/>
		<Chats.Screen
			name='RoomActionsView'
			component={RoomActionsView}
		/>
		<Chats.Screen
			name='RoomInfoView'
			component={RoomInfoView}
		/>
		<Chats.Screen
			name='RoomInfoEditView'
			component={RoomInfoEditView}
		/>
		<Chats.Screen
			name='RoomMembersView'
			component={RoomMembersView}
		/>
		<Chats.Screen
			name='SearchMessagesView'
			component={SearchMessagesView}
		/>
		<Chats.Screen
			name='SelectedUsersView'
			component={SelectedUsersView}
		/>
		<Chats.Screen
			name='InviteUsersView'
			component={InviteUsersView}
		/>
		<Chats.Screen
			name='InviteUsersEditView'
			component={InviteUsersEditView}
		/>
		<Chats.Screen
			name='MessagesView'
			component={MessagesView}
		/>
		<Chats.Screen
			name='AutoTranslateView'
			component={AutoTranslateView}
		/>
		<Chats.Screen
			name='DirectoryView'
			component={DirectoryView}
		/>
		<Chats.Screen
			name='NotificationPreferencesView'
			component={NotificationPrefView}
		/>
		<Chats.Screen
			name='RoomView'
			component={RoomView}
			options={RoomView.navigationOptions}
		/>
		<Chats.Screen
			name='ThreadMessagesView'
			component={ThreadMessagesView}
		/>
		<Chats.Screen
			name='MarkdownTableView'
			component={MarkdownTableView}
		/>
		<Chats.Screen
			name='ReadReceiptsView'
			component={ReadReceiptsView}
		/>
	</Chats.Navigator>
);

export default ChatsStack;

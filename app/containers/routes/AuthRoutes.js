import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createDrawerNavigator } from 'react-navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Sidebar from '../../containers/Sidebar';
import RoomsListView from '../../views/RoomsListView';
import RoomView from '../../views/RoomView';
import RoomActionsView from '../../views/RoomActionsView';
import CreateChannelView from '../../views/CreateChannelView';
import SelectedUsersView from '../../views/SelectedUsersView';
import NewServerView from '../../views/NewServerView';
import StarredMessagesView from '../../views/StarredMessagesView';
import PinnedMessagesView from '../../views/PinnedMessagesView';
import MentionedMessagesView from '../../views/MentionedMessagesView';
import SnippetedMessagesView from '../../views/SnippetedMessagesView';
import SearchMessagesView from '../../views/SearchMessagesView';
import RoomFilesView from '../../views/RoomFilesView';
import RoomMembersView from '../../views/RoomMembersView';
import RoomInfoView from '../../views/RoomInfoView';
import RoomInfoEditView from '../../views/RoomInfoEditView';
import ProfileView from '../../views/ProfileView';
import SettingsView from '../../views/SettingsView';

const AuthRoutes = createStackNavigator(
	{
		RoomsList: {
			screen: RoomsListView
		},
		Room: {
			screen: RoomView
		},
		CreateChannel: {
			screen: CreateChannelView,
			navigationOptions: {
				title: 'Create Channel',
				headerTintColor: '#292E35'
			}
		},
		SelectedUsers: {
			screen: SelectedUsersView,
			navigationOptions: {
				title: 'Select Users',
				headerTintColor: '#292E35'
			}
		},
		AddServer: {
			screen: NewServerView,
			navigationOptions: {
				title: 'New server',
				headerTintColor: '#292E35'
			}
		},
		RoomActions: {
			screen: RoomActionsView,
			navigationOptions: {
				title: 'Actions',
				headerTintColor: '#292E35'
			}
		},
		StarredMessages: {
			screen: StarredMessagesView,
			navigationOptions: {
				title: 'Starred Messages',
				headerTintColor: '#292E35'
			}
		},
		PinnedMessages: {
			screen: PinnedMessagesView,
			navigationOptions: {
				title: 'Pinned Messages',
				headerTintColor: '#292E35'
			}
		},
		MentionedMessages: {
			screen: MentionedMessagesView,
			navigationOptions: {
				title: 'Mentioned Messages',
				headerTintColor: '#292E35'
			}
		},
		SnippetedMessages: {
			screen: SnippetedMessagesView,
			navigationOptions: {
				title: 'Snippet Messages',
				headerTintColor: '#292E35'
			}
		},
		SearchMessages: {
			screen: SearchMessagesView,
			navigationOptions: {
				title: 'Search Messages',
				headerTintColor: '#292E35'
			}
		},
		RoomFiles: {
			screen: RoomFilesView,
			navigationOptions: {
				title: 'Room Files',
				headerTintColor: '#292E35'
			}
		},
		RoomMembers: {
			screen: RoomMembersView,
			navigationOptions: {
				title: 'Room Members',
				headerTintColor: '#292E35'
			}
		},
		RoomInfo: {
			screen: RoomInfoView,
			navigationOptions: {
				title: 'Room Info',
				headerTintColor: '#292E35'
			}
		},
		RoomInfoEdit: {
			screen: RoomInfoEditView,
			navigationOptions: {
				title: 'Room Info Edit',
				headerTintColor: '#292E35'
			}
		}
	},
	{
		navigationOptions: {
			headerTitleAllowFontScaling: false
		}
	}
);

const Routes = createDrawerNavigator(
	{
		Chats: {
			screen: AuthRoutes,
			navigationOptions: {
				drawerLabel: 'Chats',
				drawerIcon: () => <Icon name='chat-bubble' size={20} />
			}
		},
		ProfileView: {
			screen: createStackNavigator({
				ProfileView: {
					screen: ProfileView,
					navigationOptions: ({ navigation }) => ({
						title: 'Profile',
						headerTintColor: '#292E35',
						headerLeft: <Icon name='menu' size={30} color='#292E35' onPress={() => navigation.toggleDrawer()} /> // TODO: refactor
					})
				}
			})
		},
		SettingsView: {
			screen: createStackNavigator({
				SettingsView: {
					screen: SettingsView,
					navigationOptions: ({ navigation }) => ({
						title: 'Settings',
						headerTintColor: '#292E35',
						headerLeft: <Icon name='menu' size={30} color='#292E35' onPress={() => navigation.toggleDrawer()} /> // TODO: refactor
					})
				}
			})
		}
	},
	{
		contentComponent: Sidebar,
		navigationOptions: {
			drawerLockMode: Platform.OS === 'ios' ? 'locked-closed' : 'unlocked'
		},
		initialRouteName: 'Chats',
		backBehavior: 'initialRoute'
	}
);

export default Routes;

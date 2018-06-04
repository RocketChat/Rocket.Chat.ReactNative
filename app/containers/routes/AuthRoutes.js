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
import I18n from '../../i18n';

const headerTintColor = '#292E35';

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
				title: I18n.t('Create_Channel'),
				headerTintColor
			}
		},
		SelectedUsers: {
			screen: SelectedUsersView,
			navigationOptions: {
				title: I18n.t('Select_Users'),
				headerTintColor
			}
		},
		AddServer: {
			screen: NewServerView,
			navigationOptions: {
				title: I18n.t('New_Server'),
				headerTintColor
			}
		},
		RoomActions: {
			screen: RoomActionsView,
			navigationOptions: {
				title: I18n.t('Actions'),
				headerTintColor
			}
		},
		StarredMessages: {
			screen: StarredMessagesView,
			navigationOptions: {
				title: I18n.t('Starred_Messages'),
				headerTintColor
			}
		},
		PinnedMessages: {
			screen: PinnedMessagesView,
			navigationOptions: {
				title: I18n.t('Pinned_Messages'),
				headerTintColor
			}
		},
		MentionedMessages: {
			screen: MentionedMessagesView,
			navigationOptions: {
				title: I18n.t('Mentioned_Messages'),
				headerTintColor
			}
		},
		SnippetedMessages: {
			screen: SnippetedMessagesView,
			navigationOptions: {
				title: I18n.t('Snippet_Messages'),
				headerTintColor
			}
		},
		SearchMessages: {
			screen: SearchMessagesView,
			navigationOptions: {
				title: I18n.t('Search_Messages'),
				headerTintColor
			}
		},
		RoomFiles: {
			screen: RoomFilesView,
			navigationOptions: {
				title: I18n.t('Room_Files'),
				headerTintColor
			}
		},
		RoomMembers: {
			screen: RoomMembersView,
			navigationOptions: {
				title: I18n.t('Room_Members'),
				headerTintColor
			}
		},
		RoomInfo: {
			screen: RoomInfoView,
			navigationOptions: {
				title: I18n.t('Room_Info'),
				headerTintColor
			}
		},
		RoomInfoEdit: {
			screen: RoomInfoEditView,
			navigationOptions: {
				title: I18n.t('Room_Info_Edit'),
				headerTintColor
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

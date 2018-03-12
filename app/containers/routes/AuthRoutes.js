import { Platform } from 'react-native';
import { StackNavigator, DrawerNavigator } from 'react-navigation';

import Sidebar from '../../containers/Sidebar';
import RoomsListView from '../../views/RoomsListView';
import RoomView from '../../views/RoomView';
import RoomActionsView from '../../views/RoomActionsView';
import CreateChannelView from '../../views/CreateChannelView';
import SelectUsersView from '../../views/SelectUsersView';
import NewServerView from '../../views/NewServerView';
import StarredMessagesView from '../../views/StarredMessagesView';
import PinnedMessagesView from '../../views/PinnedMessagesView';
import MentionedMessagesView from '../../views/MentionedMessagesView';
import SnippetedMessagesView from '../../views/SnippetedMessagesView';
import RoomFilesView from '../../views/RoomFilesView';
import RoomMembersView from '../../views/RoomMembersView';

const AuthRoutes = StackNavigator(
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
				title: 'Create Channel'
			}
		},
		SelectUsers: {
			screen: SelectUsersView,
			navigationOptions: {
				title: 'Select Users'
			}
		},
		AddServer: {
			screen: NewServerView,
			navigationOptions: {
				title: 'New server'
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
		}
	},
	{
		navigationOptions: {
			headerTitleAllowFontScaling: false
		}
	}
);

const Routes = DrawerNavigator(
	{
		Home: {
			screen: AuthRoutes
		}
	},
	{
		contentComponent: Sidebar,
		navigationOptions: {
			drawerLockMode: Platform.OS === 'ios' ? 'locked-closed' : 'unlocked'
		}
	}
);

export default Routes;

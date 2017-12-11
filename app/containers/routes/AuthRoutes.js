import { Platform } from 'react-native';
import { StackNavigator, DrawerNavigator } from 'react-navigation';

import Sidebar from '../../containers/Sidebar';
import RoomsListView from '../../views/RoomsListView';
import RoomView from '../../views/RoomView';
import CreateChannelView from '../../views/CreateChannelView';
import SelectUsersView from '../../views/SelectUsersView';

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

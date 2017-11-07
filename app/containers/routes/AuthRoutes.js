import React from 'react';
import { Button } from 'react-native';
import { StackNavigator, DrawerNavigator, NavigationActions } from 'react-navigation';
// import { Platform } from 'react-native';

import Sidebar from '../../containers/Sidebar';
import DrawerMenuButton from '../../presentation/DrawerMenuButton';

import RoomsListView from '../../views/RoomsListView';
import RoomView from '../../views/RoomView';
import CreateChannelView from '../../views/CreateChannelView';
import SelectUsersView from '../../views/SelectUsersView';

const drawerPosition = 'left';
const drawerIconPosition = 'headerLeft';

const backToScreen = (navigation, routeName) => {
	const action = NavigationActions.reset({
		index: 0,
		actions: [NavigationActions.navigate({ routeName })]
	});
	navigation.dispatch(action);
};

const AuthRoutes = StackNavigator(
	{
		RoomsList: {
			screen: RoomsListView,
			navigationOptions({ navigation }) {
				return {
					title: 'Rooms',
					[drawerIconPosition]: <DrawerMenuButton navigation={navigation} />
				};
			}
		},
		Room: {
			screen: RoomView,
			navigationOptions({ navigation }) {
				return {
					title: navigation.state.params.title || 'Room',
					headerLeft: (
						<Button title={'Back'} onPress={() => backToScreen(navigation, 'RoomsList')} />
					)
					// [drawerIconPosition]: (<DrawerMenuButton navigation={navigation} />)÷
				};
			}
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
	{}
);

const Routes = DrawerNavigator(
	{
		Home: {
			screen: AuthRoutes,
			navigationOptions({ navigation }) {
				return {
					title: 'Rooms',
					[drawerIconPosition]: <DrawerMenuButton navigation={navigation} />
				};
			}
		}
	},
	{
		contentComponent: Sidebar,
		drawerPosition
	}
);

export default Routes;

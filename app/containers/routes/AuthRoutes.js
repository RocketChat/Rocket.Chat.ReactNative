import React from 'react';
import { StackNavigator, DrawerNavigator } from 'react-navigation';
// import { Platform } from 'react-native';

import Sidebar from '../../containers/Sidebar';
import DrawerMenuButton from '../../presentation/DrawerMenuButton';

import RoomsListView from '../../views/RoomsListView';
import RoomView from '../../views/RoomView';
import CreateChannelView from '../../views/CreateChannelView';

const drawerPosition = 'left';
const drawerIconPosition = 'headerLeft';


const AuthRoutes = StackNavigator(
	{
		RoomsList: {
			screen: RoomsListView,
			navigationOptions({ navigation }) {
				return {
					title: 'Rooms',
					[drawerIconPosition]: (<DrawerMenuButton navigation={navigation} />)
				};
			}
		},
		Room: {
			screen: RoomView,
			navigationOptions({ navigation }) {
				return {
					title: navigation.state.params.title || 'Room'
					// [drawerIconPosition]: (<DrawerMenuButton navigation={navigation} />)÷
				};
			}
		},
		CreateChannel: {
			screen: CreateChannelView,
			navigationOptions: {
				title: 'Create Channel'
			}
		}
	},
	{
	}
);

const Routes = DrawerNavigator({
	Home: {
		screen: AuthRoutes,
		navigationOptions({ navigation }) {
			return {
				title: 'Rooms',
				[drawerIconPosition]: (<DrawerMenuButton navigation={navigation} />)
			};
		}
	}
}, {
	contentComponent: Sidebar,
	drawerPosition
});

export default Routes;

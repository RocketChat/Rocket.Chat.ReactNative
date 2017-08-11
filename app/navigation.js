import React from 'react';
import { Button, Platform } from 'react-native';
import { StackNavigator } from 'react-navigation';
import LoginView from './views/login';
import NewServerView from './views/serverNew';
import ListServerView from './views/serverList';
import RoomsListView from './views/roomsList';
import RoomView from './views/room';
import CreateChannel from './views/CreateChannel';


const MainCardNavigator = StackNavigator({
	Rooms: {
		screen: RoomsListView
	},
	Room: {
		screen: RoomView
		// navigationOptions: {
		// 	header: null
		// }
	}
}, {
	initialRouteName: 'Rooms',
	cardStyle: {
		backgroundColor: '#fff'
	}
});

export default new StackNavigator({
	Main: {
		screen: MainCardNavigator,
		navigationOptions: {
			header: null
		}
	},
	Login: {
		screen: LoginView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: Platform.OS === 'ios' && (<Button title='Cancel' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />)
		})
	},
	ListServerModal: {
		screen: ListServerView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: Platform.OS === 'ios' && (<Button title='Close' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />)
		})
	},
	NewServerModal: {
		screen: NewServerView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: Platform.OS === 'ios' && (<Button title='Close' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />)
		})
	},
	CreateChannel: {
		screen: CreateChannel,
		navigationOptions: ({ navigation }) => ({
			headerLeft: Platform.OS === 'ios' && (<Button title='Cancel' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />)
		})
	}
}, {
	initialRouteName: 'Main',
	cardStyle: {
		backgroundColor: '#fff'
	},
	mode: 'modal'
});

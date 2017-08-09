import React from 'react';
import { Button } from 'react-native';
import { StackNavigator } from 'react-navigation';
import LoginView from './views/login';
import NewServerView from './views/serverNew';
import ListServerView from './views/serverList';
import RoomsListView from './views/roomsList';
import RoomView from './views/room';


const MainCardNavigator = StackNavigator({
	Rooms: {
		screen: RoomsListView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: <Button title='Servers' onPress={() => navigation.navigate('ListServerModal')} />
		})
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
			headerLeft: <Button title='Cancel' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />
		})
	},
	ListServerModal: {
		screen: ListServerView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: <Button title='Close' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />
		})
	},
	NewServerModal: {
		screen: NewServerView,
		navigationOptions: ({ navigation }) => ({
			headerLeft: <Button title='Close' onPress={() => navigation.dispatch({ type: 'Navigation/BACK' })} />
		})
	}
}, {
	initialRouteName: 'Main',
	cardStyle: {
		backgroundColor: '#fff'
	},
	mode: 'modal'
});

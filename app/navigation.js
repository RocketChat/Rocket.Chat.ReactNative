import { StackNavigator } from 'react-navigation';
import LoginView from './login';
import NewServerView from './servers/new';
import ListServerView from './servers/list';
import RoomsView from './rooms';
import RoomView from './room';

const navigationOptions = {
	// headerStyle: {
	// 	backgroundColor: '#c1272d'
	// },
	// headerTitleStyle: {
	// 	color: '#fff'
	// }
};

export default new StackNavigator({
	ListServer: {
		screen: ListServerView,
		navigationOptions
	},
	NewServer: {
		screen: NewServerView,
		navigationOptions
	},
	Login: { screen: LoginView },
	Rooms: { screen: RoomsView },
	Room: {
		screen: RoomView
		// navigationOptions: {
		// 	header: null
		// }
	}
}, {
	// initialRouteName: 'Room',
	cardStyle: {
		backgroundColor: '#fff'
	}
});

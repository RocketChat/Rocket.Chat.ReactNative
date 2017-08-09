import { StackNavigator } from 'react-navigation';
import LoginView from './views/login';
import NewServerView from './views/serverNew';
import ListServerView from './views/serverList';
import RoomsListView from './views/roomsList';
import RoomView from './views/room';

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
	Rooms: { screen: RoomsListView },
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

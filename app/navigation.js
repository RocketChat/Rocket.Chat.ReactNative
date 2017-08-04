import { StackNavigator } from 'react-navigation';
import { LoginView } from './login';
import { NewServerView } from './new-server';
import { RoomsView } from './rooms';
import { RoomView } from './room';


export default new StackNavigator({
	// Room: { screen: RoomView },
	Home: {
		navigationOptions: {
			header: null
		},
		screen: NewServerView
	},
	Login: { screen: LoginView },
	Rooms: { screen: RoomsView },
	Room: { screen: RoomView }
}, {
	cardStyle: {
		backgroundColor: '#fff'
	}
});

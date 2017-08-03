import { StackNavigator } from 'react-navigation';
import { LoginView } from './login';
import { NewServerView } from './new-server';
import { RoomsView } from './rooms';


export default new StackNavigator({
	Home: {
		navigationOptions: {
			header: null
		},
		screen: NewServerView
	},
	Login: { screen: LoginView },
	Rooms: { screen: RoomsView }
}, {
	cardStyle: {
		backgroundColor: '#fff'
	}
});

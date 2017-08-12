import { Navigation } from 'react-native-navigation';
import LoginView from './views/login';
import NewServerView from './views/serverNew';
import ListServerView from './views/serverList';
import RoomsListView from './views/roomsList';
import RoomView from './views/room';
import CreateChannel from './views/CreateChannel';


Navigation.registerComponent('Rooms', () => RoomsListView);
Navigation.registerComponent('Room', () => RoomView);
Navigation.registerComponent('ListServer', () => ListServerView);
Navigation.registerComponent('Login', () => LoginView);
Navigation.registerComponent('NewServer', () => NewServerView);
Navigation.registerComponent('CreateChannel', () => CreateChannel);

Navigation.startSingleScreenApp({
	screen: {
		screen: 'Rooms',
		title: 'Channels'
	}
});

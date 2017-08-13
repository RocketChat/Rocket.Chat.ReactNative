import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';

import LoginView from './views/login';
import NewServerView from './views/serverNew';
import ListServerView from './views/serverList';
import RoomsListView from './views/roomsList';
import RoomView from './views/room';
import CreateChannel from './views/CreateChannel';
import configureStore from './lib/createStore';

const store = configureStore();

Navigation.registerComponent('Rooms', () => RoomsListView, store, Provider);
Navigation.registerComponent('Room', () => RoomView, store, Provider);
Navigation.registerComponent('ListServer', () => ListServerView, store, Provider);
Navigation.registerComponent('Login', () => LoginView, store, Provider);
Navigation.registerComponent('NewServer', () => NewServerView, store, Provider);
Navigation.registerComponent('CreateChannel', () => CreateChannel, store, Provider);

Navigation.startSingleScreenApp({
	screen: {
		screen: 'Rooms',
		title: 'Channels'
	},
	animationType: 'none'
});

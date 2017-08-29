import React from 'react';
import {
	Scene,
	Router
	// Actions,
	// Reducer,
	// ActionConst,
	// Tabs,
	// Modal,
	// Drawer,
	// Stack,
	// Lightbox
} from 'react-native-router-flux';
// import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';

import LoginView from '../views/login';
import NewServerView from '../views/serverNew';
import ListServerView from '../views/serverList';
import RoomsListView from '../views/roomsList';
import RoomView from '../views/room';
// import PhotoView from '../views/Photo';
// import CreateChannel from '../views/CreateChannel';
import store from '../lib/createStore';

export default () => (
	<Provider store={store}>
		<Router>
			<Scene key='root'>
				<Scene key='listServer' component={ListServerView} title='Servers' />
				<Scene key='newServer' component={NewServerView} title='New Server' />
				<Scene key='login' component={LoginView} title='Login' />
				<Scene key='roomList' component={RoomsListView} />
				<Scene key='room' component={RoomView} initial />
			</Scene>
		</Router>
	</Provider>
);
// <Scene key='register' component={Register} title='Register' />

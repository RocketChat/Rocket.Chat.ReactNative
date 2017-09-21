import React from 'react';
import { Provider } from 'react-redux';

import store from './lib/createStore';

import Routes from './containers/Routes';

const RocketChat = () => (
	<Provider store={store}>
		<Routes />
	</Provider>
);

export default RocketChat;

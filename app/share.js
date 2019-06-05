import React from 'react';
import { createAppContainer, createStackNavigator } from 'react-navigation';
import { Provider } from 'react-redux';

import store from './lib/createStore';
import { appInit } from './actions';
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';

const Navigator = createStackNavigator({
	ShareListView,
	ShareView
});
const AppContainer = createAppContainer(Navigator);

class Root extends React.Component {
	constructor(props) {
		super(props);
		store.dispatch(appInit());
	}

	render() {
		return (
			<Provider store={store}>
				<AppContainer />
			</Provider>
		);
	}
}

export default Root;

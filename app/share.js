import React from 'react';
import { createAppContainer, createStackNavigator, createSwitchNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import firebase from 'react-native-firebase';

import Navigation from './lib/Navigation';
import store from './lib/createStore';
import { appInit } from './actions';
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';
import SelectServerView from './views/SelectServerView';
import AuthLoadingView from './views/AuthLoadingView';

const InsideNavigator = createStackNavigator(
	{
		ShareListView,
		ShareView,
		SelectServerView
	},
	{
		initialRouteName: 'ShareListView'
	}
);
const AppContainer = createAppContainer(createSwitchNavigator(
	{
		InsideStack: InsideNavigator,
		AuthLoading: AuthLoadingView
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

// gets the current screen from navigation state
const getActiveRouteName = (navigationState) => {
	if (!navigationState) {
		return null;
	}
	const route = navigationState.routes[navigationState.index];
	// dive into nested navigators
	if (route.routes) {
		return getActiveRouteName(route);
	}
	return route.routeName;
};

const onNavigationStateChange = (prevState, currentState) => {
	const currentScreen = getActiveRouteName(currentState);
	const prevScreen = getActiveRouteName(prevState);

	if (prevScreen !== currentScreen) {
		firebase.analytics().setCurrentScreen(currentScreen);
	}
};

class Root extends React.Component {
	constructor(props) {
		super(props);
		store.dispatch(appInit());
	}

	render() {
		return (
			<Provider store={store}>
				<AppContainer
					ref={(navigatorRef) => {
						Navigation.setTopLevelNavigator(navigatorRef);
					}}
					onNavigationStateChange={onNavigationStateChange}
				/>
			</Provider>
		);
	}
}

export default Root;

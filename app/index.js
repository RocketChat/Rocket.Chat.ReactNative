import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator, createAppContainer, createSwitchNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens';

import { appInit } from './actions';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import AuthLoadingView from './views/AuthLoadingView';
import store from './lib/createStore';

useScreens();

store.dispatch(appInit());
// store.subscribe(this.onStoreUpdate.bind(this));

const OutsideNavigator = createStackNavigator({
	OnboardingView: {
		screen: OnboardingView,
		header: null
	},
	NewServerView
});

const InsideNavigator = createStackNavigator({
	OnboardingView,
	// RoomsListView
});

const App = createAppContainer(createSwitchNavigator(
	{
		OutsideStack: OutsideNavigator,
		InsideStack: InsideNavigator,
		AuthLoading: AuthLoadingView
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

export default () => (
	<Provider store={store}>
		<App />
	</Provider>
);

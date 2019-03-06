import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator, createAppContainer, createSwitchNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens';

import { appInit } from './actions';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import LoginSignupView from './views/LoginSignupView';
import AuthLoadingView from './views/AuthLoadingView';
import RoomsListView from './views/RoomsListView';
import RoomView from './views/RoomView';
import LoginView from './views/LoginView';
import store from './lib/createStore';
import Navigation from './lib/NewNavigation';

useScreens();

store.dispatch(appInit());
// store.subscribe(this.onStoreUpdate.bind(this));

const OutsideNavigator = createStackNavigator({
	OnboardingView: {
		screen: OnboardingView,
		header: null
	},
	NewServerView,
	LoginSignupView,
	LoginView
});

const InsideNavigator = createStackNavigator({
	RoomsListView,
	RoomView
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
		<App
			ref={(navigatorRef) => {
				Navigation.setTopLevelNavigator(navigatorRef);
			}}
		/>
	</Provider>
);

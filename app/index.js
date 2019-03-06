import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator, createAppContainer, createSwitchNavigator, createDrawerNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens';

import { appInit } from './actions';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import LoginSignupView from './views/LoginSignupView';
import AuthLoadingView from './views/AuthLoadingView';
import RoomsListView from './views/RoomsListView';
import RoomView from './views/RoomView';
import NewMessageView from './views/NewMessageView';
import LoginView from './views/LoginView';
import store from './lib/createStore';
import Navigation from './lib/NewNavigation';
import Sidebar from './views/SidebarView';
import { HEADER_BACKGROUND, HEADER_TINT } from './constants/colors';

useScreens();

store.dispatch(appInit());
// store.subscribe(this.onStoreUpdate.bind(this));

const defaultHeader = {
	headerStyle: {
		backgroundColor: HEADER_BACKGROUND
	},
	headerTintColor: HEADER_TINT,
	headerBackTitle: null
}

const OutsideNavigator = createStackNavigator({
	OnboardingView: {
		screen: OnboardingView,
		header: null
	},
	NewServerView,
	LoginSignupView,
	LoginView
}, {
	defaultNavigationOptions: defaultHeader
});

const InsideNavigator = createStackNavigator({
	RoomsListView,
	RoomView
}, {
	defaultNavigationOptions: defaultHeader
});

const MyDrawerNavigator = createDrawerNavigator({
	Chats: {
		screen: InsideNavigator
	}
}, {
	contentComponent: Sidebar
});

const RootInsideNavigator = createStackNavigator({
	Main: MyDrawerNavigator,
	NewMessageView
},
{
	mode: 'modal',
	headerMode: 'none'
});

const App = createAppContainer(createSwitchNavigator(
	{
		OutsideStack: OutsideNavigator,
		InsideStack: RootInsideNavigator,
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

import React from 'react';
import { View } from 'react-native';
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
import WithoutServersView from './views/WithoutServersView';
import { isNotch } from './utils/deviceInfo';

const InsideNavigator = createStackNavigator({
	ShareListView,
	ShareView,
	SelectServerView
}, {
	initialRouteName: 'ShareListView'
});

const OutsideNavigator = createStackNavigator({
	WithoutServersView
}, {
	initialRouteName: 'WithoutServersView'
});

const AppContainer = createAppContainer(createSwitchNavigator(
	{
		OutsideStack: OutsideNavigator,
		InsideStack: InsideNavigator,
		AuthLoading: AuthLoadingView
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

const getActiveRouteName = (navigationState) => {
	if (!navigationState) {
		return null;
	}
	const route = navigationState.routes[navigationState.index];
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
		this.state = {
			isLandscape: false
		};
	}

	handleLayout = (event) => {
		const { width, height } = event.nativeEvent.layout;
		this.setState({ isLandscape: width > height });
	}

	render() {
		const { isLandscape } = this.state;
		return (
			<View style={[{ flex: 1 }, isLandscape && isNotch ? { marginTop: -44 } : {}]} onLayout={this.handleLayout}>
				<Provider store={store}>
					<AppContainer
						ref={(navigatorRef) => {
							Navigation.setTopLevelNavigator(navigatorRef);
						}}
						onNavigationStateChange={onNavigationStateChange}
					/>
				</Provider>
			</View>
		);
	}
}

export default Root;

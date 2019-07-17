import React from 'react';
import { View } from 'react-native';
import { createAppContainer, createStackNavigator, createSwitchNavigator } from 'react-navigation';
import { Provider } from 'react-redux';

import Navigation from './lib/Navigation';
import store from './lib/createStore';
import { appInit } from './actions';
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';
import SelectServerView from './views/SelectServerView';
import AuthLoadingView from './views/AuthLoadingView';
import WithoutServersView from './views/WithoutServersView';
import sharedStyles from './views/Styles';
import { isNotch } from './utils/deviceInfo';
import { defaultHeader, onNavigationStateChange } from './utils/navigation';


const InsideNavigator = createStackNavigator({
	ShareListView,
	ShareView,
	SelectServerView
}, {
	initialRouteName: 'ShareListView',
	defaultNavigationOptions: defaultHeader
});

const OutsideNavigator = createStackNavigator({
	WithoutServersView
}, {
	initialRouteName: 'WithoutServersView',
	defaultNavigationOptions: defaultHeader
});

const AppContainer = createAppContainer(createSwitchNavigator({
	OutsideStack: OutsideNavigator,
	InsideStack: InsideNavigator,
	AuthLoading: AuthLoadingView
},
{
	initialRouteName: 'AuthLoading'
}));

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
			<View
				style={[sharedStyles.container, isLandscape && isNotch ? sharedStyles.notchLandscapeContainer : {}]}
				onLayout={this.handleLayout}
			>
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

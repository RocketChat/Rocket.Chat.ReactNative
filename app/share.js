import React from 'react';
import { View } from 'react-native';
import { createAppContainer, createStackNavigator, createSwitchNavigator } from 'react-navigation';
import { Provider } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';

import Navigation from './lib/Navigation';
import store from './lib/createStore';
import database from './lib/realm';
import sharedStyles from './views/Styles';
import { isNotch, isIOS } from './utils/deviceInfo';
import { defaultHeader, onNavigationStateChange } from './utils/navigation';
import { selectServerSuccess } from './actions/server';
import { setUser } from './actions/login';
import RocketChat from './lib/rocketchat';
import { addSettings } from './actions';

const InsideNavigator = createStackNavigator({
	ShareListView: {
		getScreen: () => require('./views/ShareListView').default
	},
	ShareView: {
		getScreen: () => require('./views/ShareView').default
	},
	SelectServerView: {
		getScreen: () => require('./views/SelectServerView').default
	}
}, {
	initialRouteName: 'ShareListView',
	defaultNavigationOptions: defaultHeader
});

const OutsideNavigator = createStackNavigator({
	WithoutServersView: {
		getScreen: () => require('./views/WithoutServersView').default
	}
}, {
	initialRouteName: 'WithoutServersView',
	defaultNavigationOptions: defaultHeader
});

const AppContainer = createAppContainer(createSwitchNavigator({
	OutsideStack: OutsideNavigator,
	InsideStack: InsideNavigator,
	AuthLoading: {
		getScreen: () => require('./views/AuthLoadingView').default
	}
},
{
	initialRouteName: 'AuthLoading'
}));

class Root extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLandscape: false
		};
		this.init();
	}

	init = async() => {
		if (isIOS) {
			await RNUserDefaults.setName('group.ios.chat.rocket');
		}
		const currentServer = await RNUserDefaults.get('currentServer');

		if (currentServer) {
			// server
			database.setActiveDB(currentServer);
			const { serversDB } = database.databases;
			const server = serversDB.objectForPrimaryKey('servers', currentServer);
			store.dispatch(selectServerSuccess(currentServer, server.version));

			// add settings to upload media
			store.dispatch(addSettings({
				Site_Url: server.id,
				useRealName: server.useRealName,
				FileUpload_MediaTypeWhiteList: server.FileUpload_MediaTypeWhiteList,
				FileUpload_MaxFileSize: server.FileUpload_MaxFileSize
			}));

			// user
			const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ currentServer }`);
			const user = userId && serversDB.objectForPrimaryKey('user', userId);
			store.dispatch(setUser(user));

			await Navigation.navigate('InsideStack');
		} else {
			await Navigation.navigate('OutsideStack');
		}
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

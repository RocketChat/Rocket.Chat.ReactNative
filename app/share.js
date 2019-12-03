import React from 'react';
import { View } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { AppearanceProvider, Appearance } from 'react-native-appearance';
import { createStackNavigator } from 'react-navigation-stack';
import { Provider } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';

import { getTheme, setNativeTheme } from './utils/theme';
import Navigation from './lib/ShareNavigation';
import store from './lib/createStore';
import sharedStyles from './views/Styles';
import { isNotch, isIOS } from './utils/deviceInfo';
import { defaultHeader, onNavigationStateChange, cardStyle } from './utils/navigation';
import RocketChat, { THEME_KEY } from './lib/rocketchat';
import { ThemeContext } from './theme';

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
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const OutsideNavigator = createStackNavigator({
	WithoutServersView: {
		getScreen: () => require('./views/WithoutServersView').default
	}
}, {
	initialRouteName: 'WithoutServersView',
	defaultNavigationOptions: defaultHeader,
	cardStyle
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
			isLandscape: false,
			themePreferences: {
				currentTheme: 'automatic',
				darkLevel: 'dark'
			}
		};
		this.init();
	}

	componentWillUnmount() {
		if (this.appearanceListener && this.appearanceListener.remove) {
			this.appearanceListener.remove();
		}
	}

	subscribeAppearance = (themePreferences) => {
		const { currentTheme } = themePreferences;
		if (currentTheme === 'automatic') {
			this.appearanceListener = Appearance.addChangeListener(this.setTheme);
		}
	}

	init = async() => {
		if (isIOS) {
			await RNUserDefaults.setName('group.ios.chat.rocket');
		}
		RNUserDefaults.objectForKey(THEME_KEY).then(this.setTheme);
		const currentServer = await RNUserDefaults.get('currentServer');
		const token = await RNUserDefaults.get(RocketChat.TOKEN_KEY);

		if (currentServer && token) {
			await Navigation.navigate('InsideStack');
			await RocketChat.shareExtensionInit(currentServer);
		} else {
			await Navigation.navigate('OutsideStack');
		}
	}

	setTheme = (nextThemePreferences = {}) => {
		const { themePreferences: previousThemePreferences } = this.state;
		const newThemePreferences = { ...previousThemePreferences, ...nextThemePreferences };
		this.subscribeAppearance(newThemePreferences);
		this.setState({ themePreferences: newThemePreferences });
		setNativeTheme(newThemePreferences);
	}

	handleLayout = (event) => {
		const { width, height } = event.nativeEvent.layout;
		this.setState({ isLandscape: width > height });
	}

	render() {
		const { isLandscape, themePreferences } = this.state;
		const theme = getTheme(themePreferences);
		return (
			<AppearanceProvider>
				<View
					style={[sharedStyles.container, isLandscape && isNotch ? sharedStyles.notchLandscapeContainer : {}]}
					onLayout={this.handleLayout}
				>
					<Provider store={store}>
						<ThemeContext.Provider value={{ theme }}>
							<AppContainer
								ref={(navigatorRef) => {
									Navigation.setTopLevelNavigator(navigatorRef);
								}}
								onNavigationStateChange={onNavigationStateChange}
								screenProps={{ theme }}
							/>
						</ThemeContext.Provider>
					</Provider>
				</View>
			</AppearanceProvider>
		);
	}
}

export default Root;

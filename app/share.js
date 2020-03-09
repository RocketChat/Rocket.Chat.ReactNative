import React, { useState, useContext } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppearanceProvider } from 'react-native-appearance';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';

import {
	defaultTheme,
	newThemeState,
	subscribeTheme,
	unsubscribeTheme
} from './utils/theme';
import Navigation from './lib/ShareNavigation';
import store from './lib/createStore';
import sharedStyles from './views/Styles';
import { isNotch, isIOS, supportSystemTheme } from './utils/deviceInfo';
import { defaultHeader, onNavigationStateChange, themedHeader } from './utils/navigation';
import RocketChat, { THEME_PREFERENCES_KEY } from './lib/rocketchat';
import { ThemeContext } from './theme';

// Outside Stack
import AuthLoadingView from './views/AuthLoadingView';
import WithoutServersView from './views/WithoutServersView';

// Inside Stack
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';
import SelectServerView from './views/SelectServerView';

const Inside = createStackNavigator();
const InsideStack = () => {
	const { theme } = useContext(ThemeContext);

	return (
		<Inside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Inside.Screen
				name='ShareListView'
				component={ShareListView}
				options={ShareListView.navigationOptions}
			/>
			<Inside.Screen
				name='ShareView'
				component={ShareView}
				options={ShareView.navigationOptions}
			/>
			<Inside.Screen
				name='SelectServerView'
				component={SelectServerView}
				options={SelectServerView.navigationOptions}
			/>
		</Inside.Navigator>
	);
};

const Outside = createStackNavigator();
const OutsideStack = () => {
	const { theme } = useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Outside.Screen
				name='WithoutServersView'
				component={WithoutServersView}
				options={WithoutServersView.navigationOptions}
			/>
		</Outside.Navigator>
	);
};

const AuthContext = React.createContext();

// App
const Stack = createStackNavigator();
export const App = () => {
	const [loading] = useState(false);

	return (
		<AuthContext.Provider value={{}}>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				{loading ? (
					<Stack.Screen
						name='AuthLoading'
						component={AuthLoadingView}
					/>
				) : (
					<>
						<Stack.Screen
							name='OutsideStack'
							component={OutsideStack}
						/>
						<Stack.Screen
							name='InsideStack'
							component={InsideStack}
						/>
					</>
				)}
			</Stack.Navigator>
		</AuthContext.Provider>
	);
};

class Root extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isLandscape: false,
			theme: defaultTheme(),
			themePreferences: {
				currentTheme: supportSystemTheme() ? 'automatic' : 'light',
				darkLevel: 'dark'
			}
		};
		this.init();
	}

	componentWillUnmount() {
		RocketChat.closeShareExtension();
		unsubscribeTheme();
	}

	init = async() => {
		if (isIOS) {
			await RNUserDefaults.setName('group.ios.chat.rocket');
		}
		RNUserDefaults.objectForKey(THEME_PREFERENCES_KEY).then(this.setTheme);
		const currentServer = await RNUserDefaults.get('currentServer');
		const token = await RNUserDefaults.get(RocketChat.TOKEN_KEY);

		if (currentServer && token) {
			await Navigation.navigate('InsideStack');
			await RocketChat.shareExtensionInit(currentServer);
		} else {
			await Navigation.navigate('OutsideStack');
		}
	}

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(prevState => newThemeState(prevState, newTheme), () => {
			const { themePreferences } = this.state;
			// subscribe to Appearance changes
			subscribeTheme(themePreferences, this.setTheme);
		});
	}

	handleLayout = (event) => {
		const { width, height } = event.nativeEvent.layout;
		this.setState({ isLandscape: width > height });
	}

	render() {
		const { isLandscape, theme } = this.state;
		return (
			<AppearanceProvider>
				<View
					style={[sharedStyles.container, isLandscape && isNotch ? sharedStyles.notchLandscapeContainer : {}]}
					onLayout={this.handleLayout}
				>
					<Provider store={store}>
						<ThemeContext.Provider value={{ theme }}>
							<NavigationContainer
								ref={(navigatorRef) => {
									Navigation.setTopLevelNavigator(navigatorRef);
								}}
								onNavigationStateChange={onNavigationStateChange}
							>
								<App />
							</NavigationContainer>
						</ThemeContext.Provider>
					</Provider>
				</View>
			</AppearanceProvider>
		);
	}
}

export default Root;

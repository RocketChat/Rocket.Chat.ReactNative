import React, { useState } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppearanceProvider } from 'react-native-appearance';
import { Provider } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';
import KeyCommands, { KeyCommandsEmitter } from 'react-native-keycommands';
import RNScreens from 'react-native-screens';

import {
	defaultTheme,
	newThemeState,
	subscribeTheme,
	unsubscribeTheme
} from './utils/theme';
import EventEmitter from './utils/events';
import { appInit, appInitLocalSettings } from './actions';
import { deepLinkingOpen } from './actions/deepLinking';
import Navigation from './lib/Navigation';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import { loggerConfig, analytics } from './utils/log';
import { ThemeContext } from './theme';
import RocketChat, { THEME_PREFERENCES_KEY } from './lib/rocketchat';
import { MIN_WIDTH_SPLIT_LAYOUT } from './constants/tablet';
import {
	isTablet, isIOS, setWidth, supportSystemTheme
} from './utils/deviceInfo';
import { KEY_COMMAND } from './commands';
import Tablet, { initTabletNav } from './tablet';
import { SplitContext } from './split';
import { defaultHeader } from './utils/navigation';

// App Stack
import AuthLoadingView from './views/AuthLoadingView';

// SetUsername Stack
import SetUsernameView from './views/SetUsernameView';

import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';

RNScreens.enableScreens();

const parseDeepLinking = (url) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth|invite)\?/;
		if (url.match(regex)) {
			url = url.replace(regex, '').trim();
			if (url) {
				return parseQuery(url);
			}
		}
	}
	return null;
};

// SetUsernameStack
const SetUsername = createStackNavigator();
const SetUsernameStack = () => (
	<SetUsername.Navigator screenOptions={defaultHeader}>
		<SetUsername.Screen
			name='SetUsernameView'
			component={SetUsernameView}
		/>
	</SetUsername.Navigator>
);

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
						<Stack.Screen
							name='SetUsernameStack'
							component={SetUsernameStack}
						/>
					</>
				)}
			</Stack.Navigator>
		</AuthContext.Provider>
	);
};

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		this.init();
		this.initCrashReport();
		this.state = {
			split: false,
			inside: false,
			showModal: false,
			theme: defaultTheme(),
			themePreferences: {
				currentTheme: supportSystemTheme() ? 'automatic' : 'light',
				darkLevel: 'dark'
			}
		};
		if (isTablet) {
			this.initTablet();
		}
	}

	componentDidMount() {
		this.listenerTimeout = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);
	}

	// eslint-disable-next-line no-unused-vars
	componentDidUpdate(_, prevState) {
		if (isTablet) {
			const { split, inside } = this.state;
			if (inside && split !== prevState.split) {
				// Reset app on split mode changes
				Navigation.navigate('RoomsListView');
				this.closeModal();
			}
		}
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);

		unsubscribeTheme();

		if (this.onKeyCommands && this.onKeyCommands.remove) {
			this.onKeyCommands.remove();
		}
	}

	init = async() => {
		if (isIOS) {
			await RNUserDefaults.setName('group.ios.chat.rocket');
		}
		RNUserDefaults.objectForKey(THEME_PREFERENCES_KEY).then(this.setTheme);
		const [notification, deepLinking] = await Promise.all([initializePushNotifications(), Linking.getInitialURL()]);
		const parsedDeepLinkingURL = parseDeepLinking(deepLinking);
		store.dispatch(appInitLocalSettings());
		if (notification) {
			onNotification(notification);
		} else if (parsedDeepLinkingURL) {
			store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
		} else {
			store.dispatch(appInit());
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

	initTablet = async() => {
		initTabletNav(args => this.setState(args));
		await KeyCommands.setKeyCommands([]);
		this.onKeyCommands = KeyCommandsEmitter.addListener(
			'onKeyCommand',
			command => EventEmitter.emit(KEY_COMMAND, { event: command })
		);
	}

	initCrashReport = () => {
		RocketChat.getAllowCrashReport()
			.then((allowCrashReport) => {
				if (!allowCrashReport) {
					loggerConfig.autoNotify = false;
					loggerConfig.registerBeforeSendCallback(() => false);
					analytics().setAnalyticsCollectionEnabled(false);
				}
			});
	}

	onLayout = ({ nativeEvent: { layout: { width } } }) => (isTablet ? this.setSplit(width) : null);

	setSplit = (width) => {
		this.setState({ split: width > MIN_WIDTH_SPLIT_LAYOUT });
		setWidth(width);
	}

	closeModal = () => this.setState({ showModal: false });

	render() {
		const { split, themePreferences, theme } = this.state;

		let content = (
			<NavigationContainer
				ref={(navigatorRef) => {
					Navigation.setTopLevelNavigator(navigatorRef);
				}}
			>
				<App />
			</NavigationContainer>
		);

		if (isTablet) {
			const { inside, showModal } = this.state;
			content = (
				<SplitContext.Provider value={{ split }}>
					<Tablet
						theme={theme}
						tablet={split}
						inside={inside}
						showModal={showModal}
						closeModal={this.closeModal}
						onLayout={this.onLayout}
					>
						{content}
					</Tablet>
				</SplitContext.Provider>
			);
		}
		return (
			<AppearanceProvider>
				<Provider store={store}>
					<ThemeContext.Provider
						value={{
							theme,
							themePreferences,
							setTheme: this.setTheme
						}}
					>
						{content}
					</ThemeContext.Provider>
				</Provider>
			</AppearanceProvider>
		);
	}
}

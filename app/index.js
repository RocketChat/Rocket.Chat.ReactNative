/* eslint-disable */
import React from 'react';
import { Linking, Dimensions } from 'react-native';
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
import { appInit, appInitLocalSettings } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import Navigation from './lib/Navigation';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import { loggerConfig, analytics } from './utils/log';
import { ThemeContext } from './theme';
import RocketChat, { THEME_PREFERENCES_KEY } from './lib/rocketchat';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from './constants/tablet';
import {
	isTablet, isIOS, setWidth, supportSystemTheme
} from './utils/deviceInfo';
import { KEY_COMMAND } from './commands';
// import Tablet, { initTabletNav } from './tablet.js__';
import { SplitContext } from './split';
import AppContainer from './AppContainer';
import TwoFactor from './containers/TwoFactor';
import ScreenLockedView from './views/ScreenLockedView';
import ChangePasscodeView from './views/ChangePasscodeView';
import { MasterDetailContext } from './masterDetail';

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

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		this.init();
		this.initCrashReport();
		const { width } = Dimensions.get('window');
		this.state = {
			width,
			isMasterDetail: this.getIsMasterDetail(width),
			theme: defaultTheme(),
			themePreferences: {
				currentTheme: supportSystemTheme() ? 'automatic' : 'light',
				darkLevel: 'dark'
			}
		};
		// if (isTablet) {
		// 	this.initTablet();
		// }
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
		Dimensions.addEventListener('change', this.onDimensionsChange);
	}

	// // eslint-disable-next-line no-unused-vars
	// componentDidUpdate(_, prevState) {
	// 	if (isTablet) {
	// 		const { split, inside } = this.state;
	// 		if (inside && split !== prevState.split) {
	// 			// Reset app on split mode changes
	// 			Navigation.navigate('RoomsListView');
	// 			this.closeModal();
	// 		}
	// 	}
	// }

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
		Dimensions.removeEventListener('change', this.onDimensionsChange);

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

	getIsMasterDetail = (width) => width > MIN_WIDTH_MASTER_DETAIL_LAYOUT

	onDimensionsChange = ({ window: { width } }) => this.setState({ width, isMasterDetail: this.getIsMasterDetail(width) })

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(prevState => newThemeState(prevState, newTheme), () => {
			const { themePreferences } = this.state;
			// subscribe to Appearance changes
			subscribeTheme(themePreferences, this.setTheme);
		});
	}

	// initTablet = async() => {
	// 	// initTabletNav(args => this.setState(args));
	// 	await KeyCommands.setKeyCommands([]);
	// 	this.onKeyCommands = KeyCommandsEmitter.addListener(
	// 		'onKeyCommand',
	// 		command => EventEmitter.emit(KEY_COMMAND, { event: command })
	// 	);
	// }

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

	render() {
		const { isMasterDetail, themePreferences, theme } = this.state;
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
						<MasterDetailContext.Provider value={{ isMasterDetail }}>
							<AppContainer />
						</MasterDetailContext.Provider>
						<TwoFactor />
						<ScreenLockedView />
						<ChangePasscodeView />
					</ThemeContext.Provider>
				</Provider>
			</AppearanceProvider>
		);
	}
}

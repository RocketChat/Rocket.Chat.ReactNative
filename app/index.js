import React from 'react';
import { Linking, Dimensions } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { Provider } from 'react-redux';
import RNUserDefaults from 'rn-user-defaults';
import { KeyCommandsEmitter } from 'react-native-keycommands';
import RNScreens from 'react-native-screens';

import {
	defaultTheme,
	newThemeState,
	subscribeTheme,
	unsubscribeTheme
} from './utils/theme';
import EventEmitter from './utils/events';
import { appInit, appInitLocalSettings, setMasterDetail as setMasterDetailAction } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import { loggerConfig, analytics } from './utils/log';
import { ThemeContext } from './theme';
import RocketChat, { THEME_PREFERENCES_KEY } from './lib/rocketchat';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT } from './constants/tablet';
import {
	isTablet, supportSystemTheme
} from './utils/deviceInfo';
import { KEY_COMMAND } from './commands';
import AppContainer from './AppContainer';
import TwoFactor from './containers/TwoFactor';
import ScreenLockedView from './views/ScreenLockedView';
import ChangePasscodeView from './views/ChangePasscodeView';

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
		this.state = {
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
		Dimensions.addEventListener('change', this.onDimensionsChange);
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
		Dimensions.removeEventListener('change', this.onDimensionsChange);

		unsubscribeTheme();

		if (this.onKeyCommands && this.onKeyCommands.remove) {
			this.onKeyCommands.remove();
		}
	}

	init = async() => {
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

	getMasterDetail = (width) => {
		if (!isTablet) {
			return false;
		}
		return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
	}

	setMasterDetail = (width) => {
		const isMasterDetail = this.getMasterDetail(width);
		store.dispatch(setMasterDetailAction(isMasterDetail));
	};

	onDimensionsChange = ({ window: { width } }) => {
		this.setMasterDetail(width);
	}

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(prevState => newThemeState(prevState, newTheme), () => {
			const { themePreferences } = this.state;
			// subscribe to Appearance changes
			subscribeTheme(themePreferences, this.setTheme);
		});
	}

	initTablet = () => {
		const { width } = Dimensions.get('window');
		this.setMasterDetail(width);
		this.onKeyCommands = KeyCommandsEmitter.addListener(
			'onKeyCommand',
			(command) => {
				EventEmitter.emit(KEY_COMMAND, { event: command });
			}
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

	render() {
		const { themePreferences, theme } = this.state;
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
						<AppContainer />
						<TwoFactor />
						<ScreenLockedView />
						<ChangePasscodeView />
					</ThemeContext.Provider>
				</Provider>
			</AppearanceProvider>
		);
	}
}

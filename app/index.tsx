import { Component } from 'react';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import ResponsiveLayoutProvider from './lib/hooks/useResponsiveLayout/useResponsiveLayout';
import AppContainer from './AppContainer';
import { appInit, appInitLocalSettings } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Loading from './containers/Loading';
import StatusBar from './containers/StatusBar';
import ThemeContextProvider from './containers/ThemeContextProvider';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import { type IThemePreference } from './definitions/ITheme';
import { themes } from './lib/constants/colors';
import { getAllowAnalyticsEvents, getAllowCrashReport } from './lib/methods/crashReport';
import { toggleAnalyticsEventsReport, toggleCrashErrorsReport } from './lib/methods/helpers/log';
import parseDeepLinking from './lib/methods/helpers/parseDeepLinking';
import {
	getTheme,
	initialTheme,
	newThemeState,
	setNativeTheme,
	subscribeTheme,
	unsubscribeTheme
} from './lib/methods/helpers/theme';
import { initializePushNotifications, onNotification } from './lib/notifications';
import { getInitialNotification, setupVideoConfActionListener } from './lib/notifications/videoConf/getInitialNotification';
import {
	getInitialMediaCallEvents,
	setupMediaCallEvents,
	type MediaCallEventsAdapters
} from './lib/services/voip/MediaCallEvents';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { type TSupportedThemes } from './theme';
import ChangePasscodeView from './views/ChangePasscodeView';
import ScreenLockedView from './views/ScreenLockedView';

enableScreens();
initStore(store);

interface IState {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
}


export default class Root extends Component<{}, IState> {
	private listenerTimeout!: any;
	private videoConfActionCleanup?: () => void;
	private mediaCallEventCleanup?: () => void;

	constructor(props: any) {
		super(props);
		this.init();
		this.initCrashReport();
		const theme = initialTheme();
		this.state = {
			theme: getTheme(theme),
			themePreferences: theme
		};
		setNativeTheme(theme);
	}

	private getMediaCallEventsAdapters(): MediaCallEventsAdapters {
		return {
			getActiveServerUrl: () => store.getState().server.server,
			onOpenDeepLink: params => store.dispatch(deepLinkingOpen(params))
		};
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

		// Set up video conf action listener for background accept/decline
		this.videoConfActionCleanup = setupVideoConfActionListener();
		// Set up media call event listeners for incoming calls
		this.mediaCallEventCleanup = setupMediaCallEvents(this.getMediaCallEventsAdapters());
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
		this.videoConfActionCleanup?.();
		this.mediaCallEventCleanup?.();

		unsubscribeTheme();
	}

	init = async () => {
		store.dispatch(appInitLocalSettings());

		// Open app from push notification
		const notification = await initializePushNotifications();
		if (notification) {
			if ('configured' in notification) {
				return;
			}
			onNotification(notification);
			return;
		}

		const handledVideoConf = await getInitialNotification();
		if (handledVideoConf) {
			return;
		}

		const voipInitialHandled = await getInitialMediaCallEvents(this.getMediaCallEventsAdapters());
		if (voipInitialHandled) {
			// VoIP path already dispatched navigation (or will via deep linking); do not call appInit() in parallel
			return;
		}

		// Open app from deep linking
		const deepLinking = await Linking.getInitialURL();
		const parsedDeepLinkingURL = parseDeepLinking(deepLinking!);
		if (parsedDeepLinkingURL) {
			store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
			return;
		}

		// Open app from app icon
		store.dispatch(appInit());
	};

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(
			prevState => newThemeState(prevState, newTheme as IThemePreference),
			() => {
				const { themePreferences } = this.state;
				// subscribe to Appearance changes
				subscribeTheme(themePreferences, this.setTheme);
			}
		);
	};

	initCrashReport = () => {
		getAllowCrashReport().then(allowCrashReport => {
			toggleCrashErrorsReport(allowCrashReport);
		});
		getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
			toggleAnalyticsEventsReport(allowAnalyticsEvents);
		});
	};

	render() {
		const { themePreferences, theme } = this.state;
		return (
			<SafeAreaProvider style={{ backgroundColor: themes[this.state.theme].surfaceRoom }}>
				<Provider store={store}>
					<ThemeContextProvider theme={theme} themePreferences={themePreferences} setTheme={this.setTheme}>
						<ResponsiveLayoutProvider>
							<GestureHandlerRootView>
								<KeyboardProvider>
									<ActionSheetProvider>
										<StatusBar />
										<AppContainer />
										<TwoFactor />
										<ScreenLockedView />
										<ChangePasscodeView />
										<InAppNotification />
										<Toast />
										<Loading />
									</ActionSheetProvider>
								</KeyboardProvider>
							</GestureHandlerRootView>
						</ResponsiveLayoutProvider>
					</ThemeContextProvider>
				</Provider>
			</SafeAreaProvider>
		);
	}
}

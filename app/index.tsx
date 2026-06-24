import { Component } from 'react';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { withUnistyles } from 'react-native-unistyles';

import ResponsiveLayoutProvider from './lib/hooks/useResponsiveLayout/useResponsiveLayout';
import AppContainer from './AppContainer';
import { appInit, appInitLocalSettings } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Loading from './containers/Loading';
import StatusBar from './containers/StatusBar';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import { getAllowAnalyticsEvents, getAllowCrashReport } from './lib/methods/crashReport';
import { toggleAnalyticsEventsReport, toggleCrashErrorsReport } from './lib/methods/helpers/log';
import parseQuery from './lib/methods/helpers/parseQuery';
import { setNativeTheme, unsubscribeTheme } from './lib/methods/helpers/theme';
import { initializePushNotifications, onNotification } from './lib/notifications';
import { getInitialNotification, setupVideoConfActionListener } from './lib/notifications/videoConf/getInitialNotification';
import {
	getInitialMediaCallEvents,
	setupMediaCallEvents,
	type MediaCallEventsAdapters
} from './lib/services/voip/MediaCallEvents';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { useThemePreferencesStore } from './lib/theme/themePreferencesStore';
import ChangePasscodeView from './views/ChangePasscodeView';
import ScreenLockedView from './views/ScreenLockedView';

enableScreens();
initStore(store);

const ThemedSafeAreaProvider = withUnistyles(
	SafeAreaProvider,
	// @ts-expect-error — withUnistyles Mappings type excludes 'style', but the runtime accepts it
	(theme: { colors: { surfaceRoom: string } }) => ({ style: { backgroundColor: theme.colors.surfaceRoom } })
);

const parseDeepLinking = (url: string) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth|invite|shareextension)\?/;
		const match = url.match(regex);
		if (match) {
			const matchedPattern = match[1];
			const query = url.replace(regex, '').trim();

			if (query) {
				const parsedQuery = parseQuery(query);
				return {
					...parsedQuery,
					type: matchedPattern === 'shareextension' ? matchedPattern : parsedQuery?.type
				};
			}
		}
	}

	// Return null if the URL doesn't match or is not valid
	return null;
};

export default class Root extends Component {
	private listenerTimeout!: any;
	private videoConfActionCleanup?: () => void;
	private mediaCallEventCleanup?: () => void;

	constructor(props: any) {
		super(props);
		this.init();
		this.initCrashReport();
		setNativeTheme(useThemePreferencesStore.getState().themePreferences);
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

	initCrashReport = () => {
		getAllowCrashReport().then(allowCrashReport => {
			toggleCrashErrorsReport(allowCrashReport);
		});
		getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
			toggleAnalyticsEventsReport(allowAnalyticsEvents);
		});
	};

	render() {
		return (
			<ThemedSafeAreaProvider>
				<Provider store={store}>
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
				</Provider>
			</ThemedSafeAreaProvider>
		);
	}
}

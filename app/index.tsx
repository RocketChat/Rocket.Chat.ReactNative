import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking } from 'react-native';
import { KeyCommandsEmitter } from 'react-native-keycommands';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import RNScreens from 'react-native-screens';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { appInit, appInitLocalSettings, setMasterDetail as setMasterDetailAction } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import AppContainer from './AppContainer';
import { KEY_COMMAND } from './commands';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import Loading from './containers/Loading';
import { ICommand } from './definitions/ICommand';
import { IThemePreference } from './definitions/ITheme';
import { DimensionsContext } from './dimensions';
import { colors, isFDroidBuild, MIN_WIDTH_MASTER_DETAIL_LAYOUT, themes } from './lib/constants';
import { getAllowAnalyticsEvents, getAllowCrashReport } from './lib/methods';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './lib/notifications';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { ThemeContext } from './theme';
import { debounce, isTablet } from './lib/methods/helpers';
import EventEmitter from './lib/methods/helpers/events';
import { toggleAnalyticsEventsReport, toggleCrashErrorsReport } from './lib/methods/helpers/log';
import {
	getTheme,
	initialTheme as getInitialTheme,
	newThemeState,
	setNativeTheme,
	subscribeTheme,
	unsubscribeTheme
} from './lib/methods/helpers/theme';
import ChangePasscodeView from './views/ChangePasscodeView';
import ScreenLockedView from './views/ScreenLockedView';

RNScreens.enableScreens();
initStore(store);

interface IDimensions {
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

const parseDeepLinking = (url: string | null) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth|invite)\?/;
		if (url.match(regex)) {
			url = url.replace(regex, '').trim();
			if (url) {
				return parseQuery(url);
			}
		}
		const call = /^(https:\/\/)?jitsi.rocket.chat\//;
		const fullURL = url;

		if (url.match(call)) {
			url = url.replace(call, '').trim();
			if (url) {
				return { path: url, isCall: true, fullURL };
			}
		}
	}
	return null;
};

const setMasterDetail = (width: number) => {
	const isMasterDetail = getMasterDetail(width);
	store.dispatch(setMasterDetailAction(isMasterDetail));
};

const getMasterDetail = (width: number) => {
	if (!isTablet) {
		return false;
	}
	return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
};

const { width: widthWindow, height: heightWindow, scale: scaleWindow, fontScale: fontScaleWindow } = Dimensions.get('window');
const initialThemePreference = getInitialTheme();
const initialTheme = getTheme(initialThemePreference);

const Root = () => {
	const [theme, setTheme] = useState(initialTheme);
	const [themePreferences, setThemePreferences] = useState(initialThemePreference);
	const [dimensions, setDimensions] = useState<IDimensions>({
		width: widthWindow,
		height: heightWindow,
		scale: scaleWindow,
		fontScale: fontScaleWindow
	});

	const listenerTimeout = useRef<ReturnType<typeof setTimeout>>();
	const onKeyCommands = useRef<any>();

	useEffect(() => {
		init();
		if (!isFDroidBuild) {
			getAllowCrashReport().then(allowCrashReport => {
				toggleCrashErrorsReport(allowCrashReport);
			});
			getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
				toggleAnalyticsEventsReport(allowAnalyticsEvents);
			});
		}
		if (isTablet) {
			setMasterDetail(widthWindow);
			onKeyCommands.current = KeyCommandsEmitter.addListener('onKeyCommand', (command: ICommand) => {
				EventEmitter.emit(KEY_COMMAND, { event: command });
			});
		}
		setNativeTheme(initialThemePreference);

		listenerTimeout.current = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);
		const dimensionSubscription = Dimensions.addEventListener('change', onDimensionsChange);

		return () => {
			clearTimeout(listenerTimeout.current as ReturnType<typeof setTimeout>);
			dimensionSubscription.remove();

			unsubscribeTheme();

			if (onKeyCommands?.current?.remove) {
				onKeyCommands.current.remove?.();
			}
		};
	}, []);

	const init = useCallback(async () => {
		store.dispatch(appInitLocalSettings());

		// Open app from push notification
		const notification = await initializePushNotifications();
		if (notification) {
			onNotification(notification);
			return;
		}

		// Open app from deep linking
		const deepLinking = await Linking.getInitialURL();
		const parsedDeepLinkingURL = parseDeepLinking(deepLinking);
		if (parsedDeepLinkingURL) {
			store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
			return;
		}

		// Open app from app icon
		store.dispatch(appInit());
	}, []);

	// Dimensions update fires twice
	const onDimensionsChange = debounce(({ window }: { window: IDimensions }) => {
		setDimensions(window);
		setMasterDetail(window.width);
	});

	const setNewTheme = (newThemePreference?: IThemePreference) => {
		const { theme: newTheme, themePreferences: newThemePreferences } = newThemeState(themePreferences, newThemePreference);
		setThemePreferences(newThemePreferences);
		setTheme(newTheme);
		subscribeTheme(themePreferences, setNewTheme);
	};

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: themes[theme].backgroundColor }}>
			<Provider store={store}>
				<ThemeContext.Provider
					value={{
						theme,
						themePreferences,
						setTheme: setNewTheme,
						colors: colors[theme]
					}}
				>
					<DimensionsContext.Provider
						value={{
							...dimensions,
							setDimensions
						}}
					>
						<GestureHandlerRootView style={{ flex: 1 }}>
							<ActionSheetProvider>
								<AppContainer />
								<TwoFactor />
								<ScreenLockedView />
								<ChangePasscodeView />
								<InAppNotification />
								<Toast />
								<Loading />
							</ActionSheetProvider>
						</GestureHandlerRootView>
					</DimensionsContext.Provider>
				</ThemeContext.Provider>
			</Provider>
		</SafeAreaProvider>
	);
};

export default Root;

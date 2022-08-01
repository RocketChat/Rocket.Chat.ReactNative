import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, unstable_batchedUpdates } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
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
	initialTheme,
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

const parseDeepLinking = (url: string) => {
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

const { width: widthWindow, height: heightWindow, scale: scaleWindow, fontScale: fontScaleWindow } = Dimensions.get('window');

const Root = () => {
	const [theme, setTheme] = useState(getTheme(initialTheme()));
	const [themePreferences, setThemePreferences] = useState(initialTheme());
	const [width, setWidth] = useState(widthWindow);
	const [height, setHeight] = useState(heightWindow);
	const [scale, setScale] = useState(scaleWindow);
	const [fontScale, setFontScale] = useState(fontScaleWindow);

	const listenerTimeout = useRef<any>();
	const onKeyCommands = useRef<any>();

	useEffect(() => {
		init();
		if (!isFDroidBuild) {
			initCrashReport();
		}
		const theme = initialTheme();
		if (isTablet) {
			initTablet();
		}
		setNativeTheme(theme);

		listenerTimeout.current = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);
		Dimensions.addEventListener('change', val => {
			onDimensionsChange(val);
			console.log('🚀 ~ file: index.tsx ~ line 109 ~ Dimensions.addEventListener ~ val', val);
		});

		return () => {
			clearTimeout(listenerTimeout.current);
			Dimensions.removeEventListener('change', onDimensionsChange);

			unsubscribeTheme();

			if (onKeyCommands?.current?.remove) {
				onKeyCommands.current.remove?.();
			}
		};
	}, []);

	const init = async () => {
		store.dispatch(appInitLocalSettings());

		// Open app from push notification
		const notification = await initializePushNotifications();
		if (notification) {
			onNotification(notification);
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

	const getMasterDetail = (width: number) => {
		if (!isTablet) {
			return false;
		}
		return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
	};

	const setMasterDetail = (width: number) => {
		const isMasterDetail = getMasterDetail(width);
		store.dispatch(setMasterDetailAction(isMasterDetail));
	};

	// Dimensions update fires twice
	const onDimensionsChange = debounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
		console.log('🚀 ~ file: index.tsx ~ line 160 ~ onDimensionsChange ~ { width, height, scale, fontScale }', {
			width,
			height,
			scale,
			fontScale
		});
		setDimensions({
			width,
			height,
			scale,
			fontScale
		});
		setMasterDetail(width);
	});

	const setThemeFunction = (newThemeObject = {}) => {
		const { theme: newTheme, themePreferences: newThemePreferences } = newThemeState(
			themePreferences,
			newThemeObject as IThemePreference
		);
		setThemePreferences(newThemePreferences);
		setTheme(newTheme);
		subscribeTheme(themePreferences, setThemeFunction);
	};

	const setDimensions = ({ width, height, scale, fontScale }: IDimensions) => {
		// Test when migrate to React 18 https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
		// We need this batchedUpdates because we are calling this from a debounce and
		// the React isn't able to batch multiples setState after asynchronous function
		// https://stackoverflow.com/a/48610973
		unstable_batchedUpdates(() => {
			setWidth(width);
			setHeight(height);
			setScale(scale);
			setFontScale(fontScale);
		});
	};

	const initTablet = () => {
		setMasterDetail(width);
		onKeyCommands.current = KeyCommandsEmitter.addListener('onKeyCommand', (command: ICommand) => {
			EventEmitter.emit(KEY_COMMAND, { event: command });
		});
	};

	const initCrashReport = () => {
		getAllowCrashReport().then(allowCrashReport => {
			toggleCrashErrorsReport(allowCrashReport);
		});
		getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
			toggleAnalyticsEventsReport(allowAnalyticsEvents);
		});
	};

	console.count('🤯 App/index');

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: themes[theme].backgroundColor }}>
			<AppearanceProvider>
				<Provider store={store}>
					<ThemeContext.Provider
						value={{
							theme,
							themePreferences,
							setTheme: setThemeFunction,
							colors: colors[theme]
						}}>
						<DimensionsContext.Provider
							value={{
								width,
								height,
								scale,
								fontScale,
								setDimensions
							}}>
							<GestureHandlerRootView style={{ flex: 1 }}>
								<ActionSheetProvider>
									<AppContainer />
									<TwoFactor />
									<ScreenLockedView />
									<ChangePasscodeView />
									<InAppNotification />
									<Toast />
								</ActionSheetProvider>
							</GestureHandlerRootView>
						</DimensionsContext.Provider>
					</ThemeContext.Provider>
				</Provider>
			</AppearanceProvider>
		</SafeAreaProvider>
	);
};

export default Root;

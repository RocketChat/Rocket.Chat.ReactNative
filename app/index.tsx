import React, { useState, useEffect } from 'react';
import { Dimensions, EmitterSubscription, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import RNScreens from 'react-native-screens';
import { Provider } from 'react-redux';

import AppContainer from './AppContainer';
import { appInit, appInitLocalSettings, setMasterDetail as setMasterDetailAction } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Loading from './containers/Loading';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import { IThemePreference } from './definitions/ITheme';
import { DimensionsContext } from './dimensions';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT, colors, isFDroidBuild, themes } from './lib/constants';
import { getAllowAnalyticsEvents, getAllowCrashReport } from './lib/methods';
import { isTablet, useDebounce } from './lib/methods/helpers';
import { toggleAnalyticsEventsReport, toggleCrashErrorsReport } from './lib/methods/helpers/log';
import parseQuery from './lib/methods/helpers/parseQuery';
import {
	getTheme,
	initialTheme,
	newThemeState,
	setNativeTheme,
	subscribeTheme,
	unsubscribeTheme
} from './lib/methods/helpers/theme';
import { initializePushNotifications, onNotification } from './lib/notifications';
import { getInitialNotification } from './lib/notifications/videoConf/getInitialNotification';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { TSupportedThemes, ThemeContext } from './theme';
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

interface IState {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

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

const Root: React.FC = () => {
	const [dimensions, setDimensions] = useState<IDimensions>(Dimensions.get('window'));
	const [state, setState] = useState<{ themePreferences: IThemePreference; theme: TSupportedThemes }>({
		themePreferences: initialTheme(),
		theme: getTheme(initialTheme())
	});
	const initTheme = initialTheme();
	const [themeState, setThemeState] = useState<IState>({
		...state,
		width: dimensions.width,
		height: dimensions.height,
		scale: dimensions.scale,
		fontScale: dimensions.fontScale
	});

	useEffect(() => {
		const init = async () => {
			store.dispatch(appInitLocalSettings());

			// Open app from push notification
			const notification = await initializePushNotifications();
			if (notification) {
				onNotification(notification);
				return;
			}

			await getInitialNotification();

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

		const initTablet = () => {
			const { width } = themeState;
			setMasterDetail(width);
		};

		init();

		if (!isFDroidBuild) {
			initCrashReport();
		}

		if (isTablet) {
			initTablet();
		}

		setNativeTheme(initTheme);

		const timeout = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);

		const dimensionsListener: EmitterSubscription = Dimensions.addEventListener('change', onDimensionsChange);

		return () => {
			clearTimeout(timeout);
			dimensionsListener.remove();
			unsubscribeTheme();
		};
	}, []);

	useEffect(() => {
		subscribeTheme(themePreferences, () => setTheme(themePreferences));
	}, [themeState.themePreferences]);

	const initCrashReport = () => {
		getAllowCrashReport().then(allowCrashReport => {
			toggleCrashErrorsReport(allowCrashReport);
		});
		getAllowAnalyticsEvents().then(allowAnalyticsEvents => {
			toggleAnalyticsEventsReport(allowAnalyticsEvents);
		});
	};

	// Dimensions update fires twice
	const onDimensionsChange = useDebounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
		setDimensions({
			width,
			height,
			scale,
			fontScale
		});
		setMasterDetail(width);
	}, 300); // TODO : review the wait value

	const setTheme = (newTheme?: {} | undefined) => {
		if (!newTheme) {
			return;
		}

		// Typecast newTheme to IThemePreference
		setState(prevState => newThemeState(prevState, newTheme as IThemePreference));
		setThemeState(prevstate => ({ ...prevstate, ...state }));
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
	const { themePreferences, theme, width, height, scale, fontScale } = themeState;
	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: themes[themeState.theme].surfaceRoom }}>
			<Provider store={store}>
				<ThemeContext.Provider
					value={{
						theme,
						themePreferences,
						setTheme,
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
						<GestureHandlerRootView>
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

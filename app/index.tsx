import React from 'react';
import { Dimensions, type EmitterSubscription, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';

import AppContainer from './AppContainer';
import { appInit, appInitLocalSettings, setMasterDetail as setMasterDetailAction } from './actions/app';
import { deepLinkingOpen } from './actions/deepLinking';
import { ActionSheetProvider } from './containers/ActionSheet';
import InAppNotification from './containers/InAppNotification';
import Loading from './containers/Loading';
import Toast from './containers/Toast';
import TwoFactor from './containers/TwoFactor';
import type { IThemePreference } from './definitions/ITheme';
import { DimensionsContext } from './dimensions';
import { MIN_WIDTH_MASTER_DETAIL_LAYOUT, colors, isFDroidBuild, themes } from './lib/constants';
import { getAllowAnalyticsEvents, getAllowCrashReport } from './lib/methods';
import { debounce, isTablet } from './lib/methods/helpers';
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
import { type TSupportedThemes, ThemeContext } from './theme';
import ChangePasscodeView from './views/ChangePasscodeView';
import ScreenLockedView from './views/ScreenLockedView';

enableScreens();
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

export const Root = (function Root()  {
	const [state, setState] = React.useState<IState>(() => {
		const { width, height, scale, fontScale } = Dimensions.get('window');
		const theme = initialTheme();
		setNativeTheme(theme);
		return {
			theme: getTheme(theme),
			themePreferences: theme,
			width,
			height,
			scale,
			fontScale
		};
	});

	const listenerTimeout = React.useRef<any>();
	const dimensionsListener = React.useRef<EmitterSubscription>();

	const init = React.useCallback(async () => {
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
	}, []);

	const getMasterDetail = React.useCallback((width: number) => {
		if (!isTablet) {
			return false;
		}
		return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
	}, []);

	const setMasterDetail = React.useCallback((width: number) => {
		const isMasterDetail = getMasterDetail(width);
		store.dispatch(setMasterDetailAction(isMasterDetail));
	}, [getMasterDetail]);

	const onDimensionsChange = React.useCallback(
		debounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
			setState(prev => ({ ...prev, width, height, scale, fontScale }));
			setMasterDetail(width);
		}),
		[setMasterDetail]
	);

	const setTheme = React.useCallback((newTheme = {}) => {
		setState(prevState => {
			const nextState = newThemeState(prevState, newTheme as IThemePreference);
			subscribeTheme(nextState.themePreferences, setTheme);
			return { ...prevState, ...nextState };
		});
	}, []);

	React.useEffect(() => {
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
			setMasterDetail(state.width);
		}

		listenerTimeout.current = setTimeout(() => {
			Linking.addEventListener('url', ({ url }) => {
				const parsedDeepLinkingURL = parseDeepLinking(url);
				if (parsedDeepLinkingURL) {
					store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
				}
			});
		}, 5000);

		dimensionsListener.current = Dimensions.addEventListener('change', onDimensionsChange);

		return () => {
			clearTimeout(listenerTimeout.current);
			dimensionsListener.current?.remove?.();
			unsubscribeTheme();
		};
	}, [init, onDimensionsChange, setMasterDetail, state.width]);

	const { themePreferences, theme, width, height, scale, fontScale } = state;

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ backgroundColor: themes[theme].surfaceRoom }}>
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
							setDimensions: dims => setState(prev => ({ ...prev, ...dims }))
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
}) satisfies React.ComponentType;

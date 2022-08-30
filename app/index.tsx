import React from 'react';
import { Button, Dimensions, Linking } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
// import {BackgroundFetchResult} from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
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
import { ThemeContext, TSupportedThemes } from './theme';
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

// const BACKGROUND_FETCH_TASK = 'background-fetch';
// BackgroundFetch.setMinimumIntervalAsync(60);

// function myTask() {
// 	console.log('my task called');
// 	try {
// 		const now = Date.now();
//
// 		console.log('BACKGROUND FETCH');
// 		console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);
//
// 		// Be sure to return the successful result type!
// 		return BackgroundFetch.BackgroundFetchResult.NewData;
// 	} catch (err) {
// 		console.log('my task faild');
// 		return BackgroundFetch.BackgroundFetchResult.Failed;
// 	}
// }

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
// 	const now = Date.now();
//
// 	console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`);
//
// 	// Be sure to return the successful result type!
// 	return myTask();
// });

// 1. Define the task by providing a name and the function that should be executed
// Note: This needs to be called in the global scope (e.g outside of your React components)
// TaskManager.defineTask(BACKGROUND_FETCH_TASK, myTask);
// initBackgroundFetch(BACKGROUND_FETCH_TASK, myTask);

// 2. Register the task at some point in your app by providing the same name, and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
// eslint-disable-next-line require-await
async function registerBackgroundFetchAsync(taskName: string) {
	// console.log('registerBackgroundFetchAsync!!');
	// console.log(`status: ${  await BackgroundFetch.getStatusAsync()}`);
	// console.log('BackgroundFetch: ');
	// console.log(BackgroundFetch);
	//
	// console.log('BackgroundFetch: ');
	// console.log(BackgroundFetch.registerTaskAsync(taskName));

	// return BackgroundFetch.registerTaskAsync(taskName, {
	// 	minimumInterval: 5, // 15 minutes
	// 	stopOnTerminate: false, // android only,
	// 	startOnBoot: true // android only
	// });
	// return BackgroundFetch.registerTaskAsync(taskName);
}

// async function initBackgroundFetch(
// 	taskName: string,
// 	// taskFn: () => BackgroundFetchResult,
// 	interval = 5
// ) {
// 	try {
// 		// console.log('TaskManager: ');
// 		// console.log(TaskManager);
//
// 		// console.log('isTaskDefined: ');
// 		// console.log(TaskManager.isTaskDefined(taskName));
//
// 		if (!TaskManager.isTaskDefined(taskName)) {
// 			TaskManager.defineTask(taskName, () => myTask());
// 		}
//
// 		await registerBackgroundFetchAsync(taskName);
// 	} catch (err) {
// 		console.log('registerTaskAsync() failed:', err);
// 	}
// }

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
// eslint-disable-next-line require-await
// async function unregisterBackgroundFetchAsync() {
// 	console.log('BackgroundFetch: ');
// 	console.log(BackgroundFetch);
// 	console.log('BackgroundFetch.getStatusAsync(): ');
// 	console.log(
// 		BackgroundFetch.getStatusAsync().then(sss => {
// 			console.log('get status async resolved');
// 		})
// 	);
// 	console.log(BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK));
// 	return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
// }

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

export default class Root extends React.Component<{}, IState> {
	private listenerTimeout!: any;

	private onKeyCommands: any;

	constructor(props: any) {
		super(props);
		this.init();
		if (!isFDroidBuild) {
			this.initCrashReport();
		}
		const { width, height, scale, fontScale } = Dimensions.get('window');
		const theme = initialTheme();
		this.state = {
			theme: getTheme(theme),
			themePreferences: theme,
			width,
			height,
			scale,
			fontScale
		};
		if (isTablet) {
			this.initTablet();
		}
		setNativeTheme(theme);
	}

	async toggleFetchTask() {
		// try {
		// 	console.log('went in try');
		// 	if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)) {
		// 		console.log('did if check and true');
		// 		console.log('toggle: unregisterBackgroundFetchAsync');
		// 		await unregisterBackgroundFetchAsync();
		// 	} else {
		// 		console.log('did if check and false');
		// 		console.log('toggle: registerBackgroundFetchAsync');
		// 		await registerBackgroundFetchAsync(BACKGROUND_FETCH_TASK);
		// 	}
		// } catch (e) {
		// 	console.log(`error: ${e}`);
		// }
	}

	componentDidMount() {
		// initBackgroundFetch(BACKGROUND_FETCH_TASK);
		// this.checkStatusAsync();
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

	init = async () => {
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

	getMasterDetail = (width: number) => {
		if (!isTablet) {
			return false;
		}
		return width > MIN_WIDTH_MASTER_DETAIL_LAYOUT;
	};

	setMasterDetail = (width: number) => {
		const isMasterDetail = this.getMasterDetail(width);
		store.dispatch(setMasterDetailAction(isMasterDetail));
	};

	// Dimensions update fires twice
	onDimensionsChange = debounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
		this.setDimensions({
			width,
			height,
			scale,
			fontScale
		});
		this.setMasterDetail(width);
	});

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

	setDimensions = ({ width, height, scale, fontScale }: IDimensions) => {
		this.setState({ width, height, scale, fontScale });
	};

	initTablet = () => {
		const { width } = this.state;
		this.setMasterDetail(width);
		this.onKeyCommands = KeyCommandsEmitter.addListener('onKeyCommand', (command: ICommand) => {
			EventEmitter.emit(KEY_COMMAND, { event: command });
		});
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
		const { themePreferences, theme, width, height, scale, fontScale } = this.state;

		return (
			<SafeAreaProvider
				initialMetrics={initialWindowMetrics}
				style={{ backgroundColor: themes[this.state.theme].backgroundColor }}
			>
				<Provider store={store}>
					<ThemeContext.Provider
						value={{
							theme,
							themePreferences,
							setTheme: this.setTheme,
							colors: colors[theme]
						}}
					>
						<DimensionsContext.Provider
							value={{
								width,
								height,
								scale,
								fontScale,
								setDimensions: this.setDimensions
							}}
						>
							<GestureHandlerRootView style={{ flex: 1 }}>
								<ActionSheetProvider>
									<Button title={'register/unregister BackgroundFetch task'} onPress={this.toggleFetchTask} />
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
	}
}

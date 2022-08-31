import React, { useEffect, useRef, useState } from 'react';
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
import subscribeRooms from './lib/methods/subscriptions/rooms';
import sdk from './lib/services/sdk';
import { IDDPMessage } from './definitions/IDDPMessage';

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

function generateHash(targetLength: number) {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < targetLength; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

const useWebsocket = () => {
	const socket = new WebSocket('ws://open.rocket.chat/websocket'); // TODO: change to evenServer

	// note messageCount is incremented with every message
	// but it can works even if you didn't change it
	let messagesCount = 1;

	// the variables chatToken and chatRoomId are very important
	// and they are the identifier to the room(the whole chat) you are using
	// if you want to get access to the chat again you need these two variables tokens
	const chatToken = 't2pp8jsCO4v4v9rGiVfXD5KEzaLduSZjdWzTlaJHnSi'; // TODO: change to the user auth token

	const subId = generateHash(17);
	const notifyUserId = generateHash(17);

	console.log(`subId: ${subId} notifyUserId: ${notifyUserId}`);

	socket.onerror = err => {
		console.log(`socket: ${err}`);
	};
	// listen to messages passed to this socket
	socket.onmessage = function (e) {
		const response = JSON.parse(e.data);

		// you have to pong back if you need to keep the connection alive
		// each ping from server need a 'pong' back
		if (response.msg === 'ping') {
			socket.send(
				JSON.stringify({
					msg: 'pong'
				})
			);
			return;
		}

		if (response.msg === 'changed' && response.collection === 'stream-notify-user') {
			console.log('msg received: stream-notify-user ', response?.fields?.args[0]?.text);
			console.log(`stream-notify-user: ${response}`);
		}
	};

	// ////////////////////////////////////////////
	// steps to achieve the connection to the rocket chat real time api through WebSocket

	// 1 connect
	const connectObject = {
		msg: 'connect',
		version: '1',
		support: ['1', 'pre2', 'pre1']
	};

	setTimeout(() => {
		socket.send(JSON.stringify(connectObject));
	}, 1000);

	// 3 loginByToken
	const loginByToken = {
		msg: 'method',
		method: 'login',
		params: [{ resume: chatToken }],
		id: String(messagesCount++)
	};

	setTimeout(() => {
		socket.send(JSON.stringify(loginByToken));
	}, 2000);

	const notifyUserSub = {
		msg: 'sub',
		id: String(notifyUserId),
		name: 'stream-notify-user',
		params: [
			'KZzi4CcBtrRyZrGCa/notification', // TODO: insert userId here (right now it's shachar userId)
			false
		]
	};

	setTimeout(() => {
		socket.send(JSON.stringify(notifyUserSub));
	}, 5000);
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
		useWebsocket();
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

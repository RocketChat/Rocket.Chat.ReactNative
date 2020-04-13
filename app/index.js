import React from 'react';
import {
	View, Linking, BackHandler, ScrollView
} from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { AppearanceProvider } from 'react-native-appearance';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import RNUserDefaults from 'rn-user-defaults';
import Modal from 'react-native-modal';
import KeyCommands, { KeyCommandsEmitter } from 'react-native-keycommands';

import {
	defaultTheme,
	newThemeState,
	subscribeTheme,
	unsubscribeTheme
} from './utils/theme';
import EventEmitter from './utils/events';
import { appInit, appInitLocalSettings } from './actions';
import { deepLinkingOpen } from './actions/deepLinking';
import Navigation from './lib/Navigation';
import Sidebar from './views/SidebarView';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import NotificationBadge from './notifications/inApp';
import {
	defaultHeader, onNavigationStateChange, cardStyle, getActiveRouteName
} from './utils/navigation';
import { loggerConfig, analytics } from './utils/log';
import Toast from './containers/Toast';
import { ThemeContext } from './theme';
import RocketChat, { THEME_PREFERENCES_KEY } from './lib/rocketchat';
import { MIN_WIDTH_SPLIT_LAYOUT } from './constants/tablet';
import {
	isTablet, isSplited, isIOS, setWidth, supportSystemTheme, isAndroid
} from './utils/deviceInfo';
import { KEY_COMMAND } from './commands';
import Tablet, { initTabletNav } from './tablet';
import sharedStyles from './views/Styles';
import { SplitContext } from './split';
import TwoFactor from './containers/TwoFactor';

import RoomsListView from './views/RoomsListView';
import RoomView from './views/RoomView';

if (isIOS) {
	const RNScreens = require('react-native-screens');
	RNScreens.useScreens();
}

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

// Outside
const OutsideStack = createStackNavigator({
	OnboardingView: {
		getScreen: () => require('./views/OnboardingView').default,
		header: null
	},
	NewServerView: {
		getScreen: () => require('./views/NewServerView').default
	},
	WorkspaceView: {
		getScreen: () => require('./views/WorkspaceView').default
	},
	LoginView: {
		getScreen: () => require('./views/LoginView').default
	},
	ForgotPasswordView: {
		getScreen: () => require('./views/ForgotPasswordView').default
	},
	RegisterView: {
		getScreen: () => require('./views/RegisterView').default
	},
	LegalView: {
		getScreen: () => require('./views/LegalView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const AuthenticationWebViewStack = createStackNavigator({
	AuthenticationWebView: {
		getScreen: () => require('./views/AuthenticationWebView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const OutsideStackModal = createStackNavigator({
	OutsideStack,
	AuthenticationWebViewStack
},
{
	mode: 'modal',
	headerMode: 'none',
	cardStyle
});

const RoomRoutes = {
	RoomView,
	ThreadMessagesView: {
		getScreen: () => require('./views/ThreadMessagesView').default
	},
	MarkdownTableView: {
		getScreen: () => require('./views/MarkdownTableView').default
	},
	ReadReceiptsView: {
		getScreen: () => require('./views/ReadReceiptView').default
	}
};

// Inside
const ChatsStack = createStackNavigator({
	RoomsListView,
	RoomActionsView: {
		getScreen: () => require('./views/RoomActionsView').default
	},
	RoomInfoView: {
		getScreen: () => require('./views/RoomInfoView').default
	},
	RoomInfoEditView: {
		getScreen: () => require('./views/RoomInfoEditView').default
	},
	RoomMembersView: {
		getScreen: () => require('./views/RoomMembersView').default
	},
	SearchMessagesView: {
		getScreen: () => require('./views/SearchMessagesView').default
	},
	SelectedUsersView: {
		getScreen: () => require('./views/SelectedUsersView').default
	},
	InviteUsersView: {
		getScreen: () => require('./views/InviteUsersView').default
	},
	InviteUsersEditView: {
		getScreen: () => require('./views/InviteUsersEditView').default
	},
	MessagesView: {
		getScreen: () => require('./views/MessagesView').default
	},
	AutoTranslateView: {
		getScreen: () => require('./views/AutoTranslateView').default
	},
	DirectoryView: {
		getScreen: () => require('./views/DirectoryView').default
	},
	NotificationPrefView: {
		getScreen: () => require('./views/NotificationPreferencesView').default
	},
	PickerView: {
		getScreen: () => require('./views/PickerView').default
	},
	...RoomRoutes
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

// Inside
const RoomStack = createStackNavigator({
	...RoomRoutes
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

ChatsStack.navigationOptions = ({ navigation }) => {
	let drawerLockMode = 'unlocked';
	if (navigation.state.index > 0 || isSplited()) {
		drawerLockMode = 'locked-closed';
	}
	return {
		drawerLockMode
	};
};

const ProfileStack = createStackNavigator({
	ProfileView: {
		getScreen: () => require('./views/ProfileView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

ProfileStack.navigationOptions = ({ navigation }) => {
	let drawerLockMode = 'unlocked';
	if (navigation.state.index > 0) {
		drawerLockMode = 'locked-closed';
	}
	return {
		drawerLockMode
	};
};

const SettingsStack = createStackNavigator({
	SettingsView: {
		getScreen: () => require('./views/SettingsView').default
	},
	LanguageView: {
		getScreen: () => require('./views/LanguageView').default
	},
	ThemeView: {
		getScreen: () => require('./views/ThemeView').default
	},
	DefaultBrowserView: {
		getScreen: () => require('./views/DefaultBrowserView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const AdminPanelStack = createStackNavigator({
	AdminPanelView: {
		getScreen: () => require('./views/AdminPanelView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

SettingsStack.navigationOptions = ({ navigation }) => {
	let drawerLockMode = 'unlocked';
	if (navigation.state.index > 0) {
		drawerLockMode = 'locked-closed';
	}
	return {
		drawerLockMode
	};
};

const ChatsDrawer = createDrawerNavigator({
	ChatsStack,
	ProfileStack,
	SettingsStack,
	AdminPanelStack
}, {
	contentComponent: Sidebar,
	overlayColor: '#00000090'
});

const NewMessageStack = createStackNavigator({
	NewMessageView: {
		getScreen: () => require('./views/NewMessageView').default
	},
	SelectedUsersViewCreateChannel: {
		getScreen: () => require('./views/SelectedUsersView').default
	},
	CreateChannelView: {
		getScreen: () => require('./views/CreateChannelView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const AttachmentStack = createStackNavigator({
	AttachmentView: {
		getScreen: () => require('./views/AttachmentView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const ModalBlockStack = createStackNavigator({
	ModalBlockView: {
		getScreen: () => require('./views/ModalBlockView').default
	}
}, {
	mode: 'modal',
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const CreateDiscussionStack = createStackNavigator({
	CreateDiscussionView: {
		getScreen: () => require('./views/CreateDiscussionView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const StatusStack = createStackNavigator({
	StatusView: {
		getScreen: () => require('./views/StatusView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const InsideStackModal = createStackNavigator({
	Main: ChatsDrawer,
	NewMessageStack,
	AttachmentStack,
	ModalBlockStack,
	StatusStack,
	CreateDiscussionStack,
	JitsiMeetView: {
		getScreen: () => require('./views/JitsiMeetView').default
	}
},
{
	mode: 'modal',
	headerMode: 'none',
	cardStyle
});

const SetUsernameStack = createStackNavigator({
	SetUsernameView: {
		getScreen: () => require('./views/SetUsernameView').default
	}
},
{
	cardStyle
});

class CustomInsideStack extends React.Component {
	static router = InsideStackModal.router;

	static propTypes = {
		navigation: PropTypes.object,
		screenProps: PropTypes.object
	}

	render() {
		const { navigation, screenProps } = this.props;
		return (
			<>
				<InsideStackModal navigation={navigation} screenProps={screenProps} />
				{ !isTablet ? <NotificationBadge navigation={navigation} /> : null }
				{ !isTablet ? <Toast /> : null }
			</>
		);
	}
}

class CustomRoomStack extends React.Component {
	static router = RoomStack.router;

	static propTypes = {
		navigation: PropTypes.object,
		screenProps: PropTypes.object
	}

	render() {
		const { navigation, screenProps } = this.props;
		return (
			<>
				<RoomStack navigation={navigation} screenProps={screenProps} />
				<Toast />
			</>
		);
	}
}

const MessagesStack = createStackNavigator({
	NewMessageView: {
		getScreen: () => require('./views/NewMessageView').default
	},
	SelectedUsersViewCreateChannel: {
		getScreen: () => require('./views/SelectedUsersView').default
	},
	CreateChannelView: {
		getScreen: () => require('./views/CreateChannelView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const DirectoryStack = createStackNavigator({
	DirectoryView: {
		getScreen: () => require('./views/DirectoryView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const SidebarStack = createStackNavigator({
	SettingsView: {
		getScreen: () => require('./views/SettingsView').default
	},
	ProfileView: {
		getScreen: () => require('./views/ProfileView').default
	},
	AdminPanelView: {
		getScreen: () => require('./views/AdminPanelView').default
	},
	StatusView: {
		getScreen: () => require('./views/StatusView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});

const RoomActionsStack = createStackNavigator({
	RoomActionsView: {
		getScreen: () => require('./views/RoomActionsView').default
	},
	RoomInfoView: {
		getScreen: () => require('./views/RoomInfoView').default
	},
	RoomInfoEditView: {
		getScreen: () => require('./views/RoomInfoEditView').default
	},
	RoomMembersView: {
		getScreen: () => require('./views/RoomMembersView').default
	},
	SearchMessagesView: {
		getScreen: () => require('./views/SearchMessagesView').default
	},
	SelectedUsersView: {
		getScreen: () => require('./views/SelectedUsersView').default
	},
	MessagesView: {
		getScreen: () => require('./views/MessagesView').default
	},
	AutoTranslateView: {
		getScreen: () => require('./views/AutoTranslateView').default
	},
	ReadReceiptsView: {
		getScreen: () => require('./views/ReadReceiptView').default
	},
	NotificationPrefView: {
		getScreen: () => require('./views/NotificationPreferencesView').default
	},
	AttachmentView: {
		getScreen: () => require('./views/AttachmentView').default
	},
	PickerView: {
		getScreen: () => require('./views/PickerView').default
	}
}, {
	defaultNavigationOptions: defaultHeader,
	cardStyle
});


const ModalSwitch = createSwitchNavigator({
	MessagesStack,
	DirectoryStack,
	SidebarStack,
	RoomActionsStack,
	SettingsStack,
	ModalBlockStack,
	CreateDiscussionStack,
	AuthLoading: () => null
},
{
	initialRouteName: 'AuthLoading'
});

class CustomModalStack extends React.Component {
	static router = ModalSwitch.router;

	static propTypes = {
		navigation: PropTypes.object,
		showModal: PropTypes.bool,
		closeModal: PropTypes.func,
		screenProps: PropTypes.object
	}

	componentDidMount() {
		this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.closeModal);
	}

	componentWillUnmount() {
		this.backHandler.remove();
	}

	closeModal = () => {
		const { closeModal, navigation } = this.props;
		const { state } = navigation;
		if (state && state.routes[state.index] && state.routes[state.index].index === 0) {
			closeModal();
			return true;
		}
		if (state && state.routes[state.index] && state.routes[state.index].routes && state.routes[state.index].routes.length > 1) {
			navigation.goBack();
		}
		return false;
	}

	render() {
		const {
			navigation, showModal, closeModal, screenProps
		} = this.props;

		const pageSheetViews = ['AttachmentView'];
		const pageSheet = pageSheetViews.includes(getActiveRouteName(navigation.state));

		const androidProps = isAndroid && {
			style: { marginBottom: 0 }
		};

		let content = (
			<View style={[sharedStyles.modal, pageSheet ? sharedStyles.modalPageSheet : sharedStyles.modalFormSheet]}>
				<ModalSwitch navigation={navigation} screenProps={{ ...screenProps, closeModal: this.closeModal }} />
			</View>
		);

		if (isAndroid) {
			content = (
				<ScrollView overScrollMode='never'>
					{content}
				</ScrollView>
			);
		}

		return (
			<Modal
				useNativeDriver
				coverScreen={false}
				isVisible={showModal}
				onBackdropPress={closeModal}
				hideModalContentWhileAnimating
				avoidKeyboard
				{...androidProps}
			>
				{content}
			</Modal>
		);
	}
}

class CustomNotificationStack extends React.Component {
	static router = InsideStackModal.router;

	static propTypes = {
		navigation: PropTypes.object,
		screenProps: PropTypes.object
	}

	render() {
		const { navigation, screenProps } = this.props;
		return <NotificationBadge navigation={navigation} screenProps={screenProps} />;
	}
}

export const App = createAppContainer(createSwitchNavigator(
	{
		OutsideStack: OutsideStackModal,
		InsideStack: CustomInsideStack,
		AuthLoading: {
			getScreen: () => require('./views/AuthLoadingView').default
		},
		SetUsernameStack
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

export const RoomContainer = createAppContainer(CustomRoomStack);

export const ModalContainer = createAppContainer(CustomModalStack);

export const NotificationContainer = createAppContainer(CustomNotificationStack);

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		this.init();
		this.initCrashReport();
		this.state = {
			split: false,
			inside: false,
			showModal: false,
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
	}

	// eslint-disable-next-line no-unused-vars
	componentDidUpdate(_, prevState) {
		if (isTablet) {
			const { split, inside } = this.state;
			if (inside && split !== prevState.split) {
				// Reset app on split mode changes
				Navigation.navigate('RoomsListView');
				this.closeModal();
			}
		}
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);

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

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(prevState => newThemeState(prevState, newTheme), () => {
			const { themePreferences } = this.state;
			// subscribe to Appearance changes
			subscribeTheme(themePreferences, this.setTheme);
		});
	}

	initTablet = async() => {
		initTabletNav(args => this.setState(args));
		await KeyCommands.setKeyCommands([]);
		this.onKeyCommands = KeyCommandsEmitter.addListener(
			'onKeyCommand',
			command => EventEmitter.emit(KEY_COMMAND, { event: command })
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

	onLayout = ({ nativeEvent: { layout: { width } } }) => (isTablet ? this.setSplit(width) : null);

	setSplit = (width) => {
		this.setState({ split: width > MIN_WIDTH_SPLIT_LAYOUT });
		setWidth(width);
	}

	closeModal = () => this.setState({ showModal: false });

	render() {
		const { split, themePreferences, theme } = this.state;

		let content = (
			<App
				ref={(navigatorRef) => {
					Navigation.setTopLevelNavigator(navigatorRef);
				}}
				screenProps={{ split, theme }}
				onNavigationStateChange={onNavigationStateChange}
			/>
		);

		if (isTablet) {
			const { inside, showModal } = this.state;
			content = (
				<SplitContext.Provider value={{ split }}>
					<Tablet
						theme={theme}
						tablet={split}
						inside={inside}
						showModal={showModal}
						closeModal={this.closeModal}
						onLayout={this.onLayout}
					>
						{content}
					</Tablet>
				</SplitContext.Provider>
			);
		}
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
						{content}
						<TwoFactor />
					</ThemeContext.Provider>
				</Provider>
			</AppearanceProvider>
		);
	}
}

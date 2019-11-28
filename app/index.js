import React from 'react';
import { View, Linking, BackHandler } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import KeyCommands, { KeyCommandsEmitter } from 'react-native-keycommands';

import EventEmitter from './utils/events';
import { appInit } from './actions';
import { deepLinkingOpen } from './actions/deepLinking';
import Navigation from './lib/Navigation';
import Sidebar from './views/SidebarView';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import NotificationBadge from './notifications/inApp';
import { defaultHeader, onNavigationStateChange } from './utils/navigation';
import { loggerConfig, analytics } from './utils/log';
import Toast from './containers/Toast';
import RocketChat from './lib/rocketchat';
import { MIN_WIDTH_SPLIT_LAYOUT } from './constants/tablet';
import {
	isTablet, isSplited, isIOS, setWidth
} from './utils/deviceInfo';
import { KEY_COMMAND } from './commands';
import Tablet, { initTabletNav } from './tablet';
import sharedStyles from './views/Styles';
import { SplitContext } from './split';

if (isIOS) {
	const RNScreens = require('react-native-screens');
	RNScreens.useScreens();
}

const parseDeepLinking = (url) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth)\?/;
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
	LoginSignupView: {
		getScreen: () => require('./views/LoginSignupView').default
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
	defaultNavigationOptions: defaultHeader
});

const AuthenticationWebViewStack = createStackNavigator({
	AuthenticationWebView: {
		getScreen: () => require('./views/AuthenticationWebView').default
	}
}, {
	defaultNavigationOptions: defaultHeader
});

const OutsideStackModal = createStackNavigator({
	OutsideStack,
	AuthenticationWebViewStack
},
{
	mode: 'modal',
	headerMode: 'none'
});

const RoomRoutes = {
	RoomView: {
		getScreen: () => require('./views/RoomView').default
	},
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
	RoomsListView: {
		getScreen: () => require('./views/RoomsListView').default
	},
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
	DirectoryView: {
		getScreen: () => require('./views/DirectoryView').default
	},
	NotificationPrefView: {
		getScreen: () => require('./views/NotificationPreferencesView').default
	},
	...RoomRoutes
}, {
	defaultNavigationOptions: defaultHeader
});

// Inside
const RoomStack = createStackNavigator({
	...RoomRoutes
}, {
	defaultNavigationOptions: defaultHeader
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
	defaultNavigationOptions: defaultHeader
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
	}
}, {
	defaultNavigationOptions: defaultHeader
});

const AdminPanelStack = createStackNavigator({
	AdminPanelView: {
		getScreen: () => require('./views/AdminPanelView').default
	}
}, {
	defaultNavigationOptions: defaultHeader
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
	defaultNavigationOptions: defaultHeader
});

const InsideStackModal = createStackNavigator({
	Main: ChatsDrawer,
	NewMessageStack,
	JitsiMeetView: {
		getScreen: () => require('./views/JitsiMeetView').default
	}
},
{
	mode: 'modal',
	headerMode: 'none'
});

const SetUsernameStack = createStackNavigator({
	SetUsernameView: {
		getScreen: () => require('./views/SetUsernameView').default
	}
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
	defaultNavigationOptions: defaultHeader
});

const DirectoryStack = createStackNavigator({
	DirectoryView: {
		getScreen: () => require('./views/DirectoryView').default
	}
}, {
	defaultNavigationOptions: defaultHeader
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
	}
}, {
	defaultNavigationOptions: defaultHeader
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
	}
}, {
	defaultNavigationOptions: defaultHeader
});


const ModalSwitch = createSwitchNavigator({
	MessagesStack,
	DirectoryStack,
	SidebarStack,
	RoomActionsStack,
	SettingsStack,
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
		return false;
	}

	render() {
		const {
			navigation, showModal, closeModal, screenProps
		} = this.props;
		return (
			<Modal
				useNativeDriver
				coverScreen={false}
				isVisible={showModal}
				onBackdropPress={closeModal}
				hideModalContentWhileAnimating
				avoidKeyboard
			>
				<View style={sharedStyles.modal}>
					<ModalSwitch navigation={navigation} screenProps={screenProps} />
				</View>
			</Modal>
		);
	}
}

class CustomNotificationStack extends React.Component {
	static router = InsideStackModal.router;

	static propTypes = {
		navigation: PropTypes.object
	}

	render() {
		const { navigation } = this.props;
		return <NotificationBadge navigation={navigation} />;
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
			showModal: false
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
		if (this.onKeyCommands && this.onKeyCommands.remove) {
			this.onKeyCommands.remove();
		}
	}

	init = async() => {
		const [notification, deepLinking] = await Promise.all([initializePushNotifications(), Linking.getInitialURL()]);
		const parsedDeepLinkingURL = parseDeepLinking(deepLinking);
		if (notification) {
			onNotification(notification);
		} else if (parsedDeepLinkingURL) {
			store.dispatch(deepLinkingOpen(parsedDeepLinkingURL));
		} else {
			store.dispatch(appInit());
		}
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
		const { split } = this.state;

		let content = (
			<App
				ref={(navigatorRef) => {
					Navigation.setTopLevelNavigator(navigatorRef);
				}}
				screenProps={{ split }}
				onNavigationStateChange={onNavigationStateChange}
			/>
		);

		if (isTablet) {
			const { inside, showModal } = this.state;
			content = (
				<SplitContext.Provider value={{ split }}>
					<Tablet
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
			<Provider store={store}>
				{content}
			</Provider>
		);
	}
}

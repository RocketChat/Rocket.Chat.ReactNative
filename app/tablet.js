import React from 'react';
import { createAppContainer, createSwitchNavigator, NavigationActions } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens'; // eslint-disable-line import/no-unresolved
import {
	View, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import Orientation from 'react-native-orientation-locker';

import { appInit } from './actions';
import { deepLinkingOpen } from './actions/deepLinking';
import Navigation from './lib/Navigation';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications, onNotification } from './notifications/push';
import store from './lib/createStore';
import NotificationBadge from './notifications/inApp';
import { defaultHeader, onNavigationStateChange } from './utils/navigation';
import { loggerConfig, analytics } from './utils/log';
import Toast from './containers/Toast';
import RocketChat from './lib/rocketchat';
import { COLOR_BORDER } from './constants/colors';
import LayoutAnimation from './utils/layoutAnimation';

useScreens();

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

// Side list
const ListStack = createStackNavigator({
	RoomsListView: {
		getScreen: () => require('./views/RoomsListView').default
	}
}, {
	defaultNavigationOptions: defaultHeader
});

// Inside
const ChatsStack = createStackNavigator({
	Home: {
		getScreen: () => require('./views/RoomView').default
	},
	RoomView: {
		getScreen: () => require('./views/RoomView').default
	},
	ThreadMessagesView: {
		getScreen: () => require('./views/ThreadMessagesView').default
	},
	TableView: {
		getScreen: () => require('./views/TableView').default
	}
}, {
	defaultNavigationOptions: defaultHeader
});

ChatsStack.navigationOptions = ({ navigation }) => {
	let drawerLockMode = 'unlocked';
	if (navigation.state.index > 0) {
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
	ListStack,
	ProfileStack,
	SettingsStack,
	AdminPanelStack
}, {
	contentComponent: () => null
});

const InsideStackModal = createStackNavigator({
	Main: ChatsStack,
	JitsiMeetView: {
		getScreen: () => require('./views/JitsiMeetView').default
	}
},
{
	mode: 'modal',
	headerMode: 'none'
});

const ListStackModal = createStackNavigator({
	Main: ChatsDrawer
},
{
	mode: 'modal',
	headerMode: 'none'
});

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
	SidebarView: {
		getScreen: () => require('./views/SidebarView').default
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
	}
}, {
	defaultNavigationOptions: defaultHeader
});

const ModalSwitch = createSwitchNavigator({
	MessagesStack,
	DirectoryStack,
	SidebarStack,
	RoomActionsStack,
	AuthLoading: {
		getScreen: () => require('./views/AuthLoadingView').default
	}
},
{
	initialRouteName: 'AuthLoading'
});

const SetUsernameStack = createStackNavigator({
	SetUsernameView: {
		getScreen: () => require('./views/SetUsernameView').default
	}
});

class CustomInsideStack extends React.Component {
	static router = InsideStackModal.router;

	static propTypes = {
		navigation: PropTypes.object
	}

	render() {
		const { navigation } = this.props;
		return (
			<React.Fragment>
				<InsideStackModal navigation={navigation} />
				<NotificationBadge navigation={navigation} />
				<Toast />
			</React.Fragment>
		);
	}
}

const App = createAppContainer(createSwitchNavigator(
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

const ListContainer = createAppContainer(ListStackModal);

const ModalContainer = createAppContainer(ModalSwitch);

export class MasterDetailView extends React.Component {
	state = {
		inside: false,
		landscape: Orientation.getInitialOrientation().includes('LANDSCAPE'),
		inCall: false,
		showModal: false
	};

	componentDidMount() {
		const defaultModalGetStateForAction = ModalContainer.router.getStateForAction;
		const defaultDetailsGetStateForAction = ListContainer.router.getStateForAction;
		const defaultMasterGetStateForAction = App.router.getStateForAction;

		ModalContainer.router.getStateForAction = (action, state) => {
			if (action.type === 'Navigation/POP') {
				this.setState({ showModal: false });
			}
			action.params = action.params || this.params;
			if (action.type === NavigationActions.NAVIGATE) {
				const { routeName } = action;
				if (routeName === 'RoomView') {
					this.setState({ showModal: false });
				}
				if (routeName === 'JitsiMeetView') {
					this.setState({ inCall: true, showModal: false });
				}
			}
			return defaultModalGetStateForAction(action, state);
		};

		ListContainer.router.getStateForAction = (action, state) => {
			if (action.type === NavigationActions.NAVIGATE) {
				const { routeName, params } = action;
				if (routeName === 'RoomView') {
					this.listRef.dispatch(NavigationActions.navigate({ routeName: 'RoomsListView' }));
					Navigation.navigate('Home');
				}
				if (routeName === 'OnboardingView') {
					this.setState({ inside: false });
				}
				if (routeName === 'NewMessageView') {
					this.modalRef.dispatch(NavigationActions.navigate({ routeName }));
					this.setState({ showModal: true });
					this.params = params;
					return null;
				}
				if (routeName === 'DirectoryView') {
					this.modalRef.dispatch(NavigationActions.navigate({ routeName }));
					this.setState({ showModal: true });
					return null;
				}
				Navigation.navigate(routeName, params);
			}
			if (action.type === 'Navigation/TOGGLE_DRAWER') {
				this.modalRef.dispatch(NavigationActions.navigate({ routeName: 'SidebarView' }));
				this.setState({ showModal: true });
				return null;
			}
			return defaultDetailsGetStateForAction(action, state);
		};

		App.router.getStateForAction = (action, state) => {
			const { inCall } = this.state;
			if (action.type === NavigationActions.NAVIGATE) {
				const { routeName, params } = action;
				if (routeName === 'InsideStack') {
					this.setState({ inside: true });
				}
				if (routeName === 'OutsideStack') {
					this.setState({ inside: false });
				}
				if (routeName === 'JitsiMeetView') {
					this.setState({ inCall: true });
				}
				if (routeName === 'RoomView') {
					this.setState({ showModal: false });
				}
				if (routeName === 'RoomActionsView') {
					this.setState({ showModal: true });
					this.modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
					return null;
				}
			}
			if (action.type === 'Navigation/POP' && inCall) {
				this.setState({ inCall: false });
			}
			return defaultMasterGetStateForAction(action, state);
		};
		Orientation.addOrientationListener(this._orientationDidChange);
	}

	componentWillUnmount() {
		Orientation.removeOrientationListener(this._orientationDidChange);
	}

	_orientationDidChange = orientation => this.setState({ landscape: orientation.includes('LANDSCAPE') });

	renderModal = () => {
		const { showModal } = this.state;
		// https://github.com/react-navigation/react-navigation/issues/5458
		return (
			<View
				style={{
					width: showModal ? '70%' : 1,
					height: showModal ? '70%' : 1,
					position: 'absolute',
					overflow: 'hidden',
					borderRadius: 16,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.8,
					shadowRadius: 2,
					elevation: 1
				}}
			>
				<ModalContainer
					ref={(modalRef) => {
						this.modalRef = modalRef;
					}}
				/>
			</View>
		);
	}

	renderSideView = () => {
		const { landscape } = this.state;
		return (
			<>
				<View style={{ flex: landscape ? 4 : 5 }}>
					<ListContainer
						ref={(listRef) => {
							this.listRef = listRef;
						}}
					/>
				</View>
				<View style={{ height: '100%', width: 1, backgroundColor: COLOR_BORDER }} />
			</>
		);
	}

	render() {
		const { inside, inCall, landscape } = this.state;
		return (
			<View
				style={{
					flex: 1,
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center'
				}}
			>
				{ inside && !inCall ? this.renderSideView() : null }
				<View style={{ flex: landscape ? 9 : 7 }}>
					<App
						ref={(navigatorRef) => {
							Navigation.setTopLevelNavigator(navigatorRef);
						}}
						onNavigationStateChange={onNavigationStateChange}
					/>
				</View>
				{ this.renderModal() }
			</View>
		);
	}
}

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		this.init();
		this.initCrashReport();
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

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
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

	render() {
		return (
			<Provider store={store}>
				<LayoutAnimation>
					<MasterDetailView />
				</LayoutAnimation>
			</Provider>
		);
	}
}

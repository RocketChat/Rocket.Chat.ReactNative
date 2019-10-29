import React from 'react';
import {
	createAppContainer, createSwitchNavigator, NavigationActions, StackActions
} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createDrawerNavigator } from 'react-navigation-drawer';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens'; // eslint-disable-line import/no-unresolved
import { Linking, View } from 'react-native';
import PropTypes from 'prop-types';
import KeyCommands, { constants } from '@envoy/react-native-key-commands';

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
import LayoutAnimation, { animateNextTransition } from './utils/layoutAnimation';
import { isTablet } from './utils/deviceInfo';
import Modal from './presentation/Modal';
import sharedStyles from './views/Styles';

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

const ChatsRoutes = {
	RoomView: {
		getScreen: () => require('./views/RoomView').default
	},
	ThreadMessagesView: {
		getScreen: () => require('./views/ThreadMessagesView').default
	},
	TableView: {
		getScreen: () => require('./views/TableView').default
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
	ReadReceiptsView: {
		getScreen: () => require('./views/ReadReceiptView').default
	},
	DirectoryView: {
		getScreen: () => require('./views/DirectoryView').default
	},
	NotificationPrefView: {
		getScreen: () => require('./views/NotificationPreferencesView').default
	},
	...ChatsRoutes
}, {
	defaultNavigationOptions: defaultHeader
});

// Inside
const RoomStack = createStackNavigator({
	...ChatsRoutes
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
		navigation: PropTypes.object
	}

	render() {
		const { navigation } = this.props;
		return (
			<>
				<InsideStackModal navigation={navigation} />
				{ !isTablet() ? (
					<>
						<NotificationBadge navigation={navigation} />
						<Toast />
					</>
				) : null }
			</>
		);
	}
}

class CustomRoomStack extends React.Component {
	static router = RoomStack.router;

	static propTypes = {
		navigation: PropTypes.object
	}

	render() {
		const { navigation } = this.props;
		return (
			<>
				<RoomStack navigation={navigation} />
				<NotificationBadge navigation={navigation} />
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
	ProfileStack,
	SettingsStack,
	AdminPanelStack,
	AuthLoading: () => null
},
{
	initialRouteName: 'AuthLoading'
});

class CustomModalStack extends React.Component {
	static router = ModalSwitch.router;

	static propTypes = {
		navigation: PropTypes.object,
		showModal: PropTypes.bool
	}

	render() {
		const { navigation, showModal } = this.props;
		if (!showModal) { return null; }
		return (
			<Modal>
				<ModalSwitch navigation={navigation} />
			</Modal>
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

const RoomContainer = createAppContainer(CustomRoomStack);

const ModalContainer = createAppContainer(CustomModalStack);

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		this.init();
		this.initCrashReport();
		this.state = {
			tablet: false,
			inside: false
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

		if (isTablet(false)) {
			this.initTabletNav();
		}
	}

	componentWillUnmount() {
		clearTimeout(this.listenerTimeout);
	}

	initTabletNav = () => {
		const defaultApp = App.router.getStateForAction;
		const defaultModal = ModalContainer.router.getStateForAction;
		const defaultRoom = RoomContainer.router.getStateForAction;

		RoomContainer.router.getStateForAction = (action, state) => {
			const { tablet } = this.state;
			if (action.type === NavigationActions.NAVIGATE && isTablet() && tablet) {
				const { routeName, params } = action;
				if (routeName === 'RoomActionsView') {
					this.modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
					this.setState({ showModal: true });
					return null;
				}
			}
			return defaultRoom(action, state);
		};

		ModalContainer.router.getStateForAction = (action, state) => {
			const { tablet } = this.state;
			if (action.type === 'Navigation/POP' && isTablet() && tablet) {
				this.modalRef.dispatch(NavigationActions.navigate({ routeName: 'AuthLoading' }));
				this.setState({ showModal: false });
			}
			if (action.type === NavigationActions.NAVIGATE && isTablet() && tablet) {
				const { routeName, params } = action;
				if (routeName === 'RoomView') {
					Navigation.navigate(routeName, params);
				}
			}
			return defaultModal(action, state);
		};

		App.router.getStateForAction = (action, state) => {
			const { tablet } = this.state;
			if (action.type === NavigationActions.NAVIGATE && isTablet() && tablet) {
				const { routeName, params } = action;

				if (routeName === 'InsideStack') {
					this.setState({ inside: true });
				}
				if (routeName === 'OutsideStack') {
					this.setState({ inside: false, showModal: false });
				}
				if (routeName === 'JitsiMeetView') {
					this.inCall = true;
					this.setState({ inside: false, showModal: false });
				}

				if (routeName === 'RoomView') {
					const resetAction = StackActions.reset({
						index: 0,
						actions: [NavigationActions.navigate({ routeName, params })]
					});
					this.roomRef.dispatch(resetAction);
					this.setState({ showModal: false });
					return null;
				}

				if (routeName === 'NewMessageView') {
					this.modalRef.dispatch(NavigationActions.navigate({ routeName, params }));
					this.setState({ showModal: true });
					return null;
				}
				if (routeName === 'DirectoryView') {
					this.modalRef.dispatch(NavigationActions.navigate({ routeName }));
					this.setState({ showModal: true });
					return null;
				}
			}
			if (action.type === 'Navigation/TOGGLE_DRAWER' && isTablet() && tablet) {
				this.modalRef.dispatch(NavigationActions.navigate({ routeName: 'SettingsView' }));
				this.setState({ showModal: true });
				return null;
			}
			if (action.type === 'Navigation/POP' && this.inCall) {
				this.setState({ inside: true, showModal: false });
			}
			return defaultApp(action, state);
		};
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

	renderRight = () => (
		<>
			<View style={[sharedStyles.container, sharedStyles.separatorLeft]}>
				<RoomContainer
					ref={(roomRef) => {
						this.roomRef = roomRef;
					}}
				/>
			</View>
		</>
	)

	changeTablet = () => {
		if (isTablet(false)) {
			animateNextTransition();
			this.setState({ tablet: isTablet() });
		}
	};

	onKeyCommand = event => EventEmitter.emit('KeyCommands', { event });

	render() {
		const { tablet, inside, showModal } = this.state;
		return (
			<Provider store={store}>
				<LayoutAnimation>
					<KeyCommands
						style={{ flex: 1 }}
						keyCommands={[
							{
								input: '\t',
								modifierFlags: 0,
								discoverabilityTitle: 'shortcuts.type_message'
							},
							{
								input: 'p',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.preferences'
							},
							{
								input: 't',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.new_room'
							},
							{
								input: '{',
								// eslint-disable-next-line no-bitwise
								modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
								discoverabilityTitle: 'shortcuts.new_room'
							},
							{
								input: 'f',
								// eslint-disable-next-line no-bitwise
								modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
								discoverabilityTitle: 'shortcuts.room_search'
							},
							...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
								input: `${ value }`,
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.room_selection'
							}))),
							...([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => ({
								input: `${ value }`,
								// eslint-disable-next-line no-bitwise
								modifierFlags: constants.keyModifierCommand | constants.keyModifierAlternate,
								discoverabilityTitle: 'shortcuts.serverSelection'
							}))),
							{
								input: '\r',
								modifierFlags: 0,
								discoverabilityTitle: 'shortcuts.send'
							},
							{
								input: 'o',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.file_messsage'
							},
							{
								input: 'u',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.room_actions'
							},
							{
								input: constants.keyInputUpArrow,
								// eslint-disable-next-line no-bitwise
								modifierFlags: constants.keyModifierAlternate,
								discoverabilityTitle: 'shortcuts.scroll_messages'
							},
							{
								input: constants.keyInputDownArrow,
								// eslint-disable-next-line no-bitwise
								modifierFlags: constants.keyModifierAlternate,
								discoverabilityTitle: 'shortcuts.scroll_messages'
							},
							{
								input: ']',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.next_room'
							},
							{
								input: '[',
								modifierFlags: constants.keyModifierCommand,
								discoverabilityTitle: 'shortcuts.previous_room'
							}
						]}
						onKeyCommand={this.onKeyCommand}
					>
						<View style={sharedStyles.containerSplitView} onLayout={this.changeTablet}>
							<View style={[sharedStyles.container, tablet && inside && { maxWidth: 320 }]}>
								<App
									ref={(navigatorRef) => {
										Navigation.setTopLevelNavigator(navigatorRef);
									}}
									onNavigationStateChange={onNavigationStateChange}
								/>
							</View>
							{ isTablet() && tablet && inside ? (
								<>
									{ this.renderRight() }
									<ModalContainer
										showModal={showModal}
										ref={(modalRef) => {
											this.modalRef = modalRef;
										}}
									/>
								</>
							) : null }
						</View>
					</KeyCommands>
				</LayoutAnimation>
			</Provider>
		);
	}
}

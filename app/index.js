import React from 'react';
import {
	createStackNavigator, createAppContainer, createSwitchNavigator, createDrawerNavigator
} from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens'; // eslint-disable-line import/no-unresolved
import { Linking } from 'react-native';
import { PendingNotifications } from 'react-native-notifications';
import EJSON from 'ejson';

import { appInit } from './actions';
import { deepLinkingOpen } from './actions/deepLinking';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import LoginSignupView from './views/LoginSignupView';
import AuthLoadingView from './views/AuthLoadingView';
import RoomsListView from './views/RoomsListView';
import RoomView from './views/RoomView';
import NewMessageView from './views/NewMessageView';
import LoginView from './views/LoginView';
import Navigation from './lib/Navigation';
import Sidebar from './views/SidebarView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import RoomActionsView from './views/RoomActionsView';
import RoomInfoView from './views/RoomInfoView';
import RoomInfoEditView from './views/RoomInfoEditView';
import RoomMembersView from './views/RoomMembersView';
import RoomFilesView from './views/RoomFilesView';
import MentionedMessagesView from './views/MentionedMessagesView';
import StarredMessagesView from './views/StarredMessagesView';
import SearchMessagesView from './views/SearchMessagesView';
import PinnedMessagesView from './views/PinnedMessagesView';
import SelectedUsersView from './views/SelectedUsersView';
import CreateChannelView from './views/CreateChannelView';
import LegalView from './views/LegalView';
import TermsServiceView from './views/TermsServiceView';
import PrivacyPolicyView from './views/PrivacyPolicyView';
import ForgotPasswordView from './views/ForgotPasswordView';
import RegisterView from './views/RegisterView';
import OAuthView from './views/OAuthView';
import SetUsernameView from './views/SetUsernameView';
import { HEADER_BACKGROUND, HEADER_TITLE, HEADER_BACK } from './constants/colors';
import parseQuery from './lib/methods/helpers/parseQuery';
import { initializePushNotifications } from './push';
import store from './lib/createStore';

useScreens();

const handleOpenURL = ({ url }) => {
	if (url) {
		url = url.replace(/rocketchat:\/\/|https:\/\/go.rocket.chat\//, '');
		const regex = /^(room|auth)\?/;
		if (url.match(regex)) {
			url = url.replace(regex, '');
			const params = parseQuery(url);
			store.dispatch(deepLinkingOpen(params));
		}
	}
};

const defaultHeader = {
	headerStyle: {
		backgroundColor: HEADER_BACKGROUND
	},
	headerTitleStyle: {
		color: HEADER_TITLE
	},
	headerBackTitle: null,
	headerTintColor: HEADER_BACK
};

// Outside
const OutsideStack = createStackNavigator({
	OnboardingView: {
		screen: OnboardingView,
		header: null
	},
	NewServerView,
	LoginSignupView,
	LoginView,
	ForgotPasswordView,
	RegisterView
}, {
	defaultNavigationOptions: defaultHeader
});

const LegalStack = createStackNavigator({
	LegalView,
	TermsServiceView,
	PrivacyPolicyView
}, {
	defaultNavigationOptions: defaultHeader
});

const OAuthStack = createStackNavigator({
	OAuthView
}, {
	defaultNavigationOptions: defaultHeader
});

const OutsideStackModal = createStackNavigator({
	OutsideStack,
	LegalStack,
	OAuthStack
},
{
	mode: 'modal',
	headerMode: 'none'
});

// Inside
const ChatsStack = createStackNavigator({
	RoomsListView,
	RoomView,
	RoomActionsView,
	RoomInfoView,
	RoomInfoEditView,
	RoomMembersView,
	RoomFilesView,
	MentionedMessagesView,
	StarredMessagesView,
	SearchMessagesView,
	PinnedMessagesView,
	SelectedUsersView
}, {
	defaultNavigationOptions: defaultHeader
});

const ProfileStack = createStackNavigator({
	ProfileView
}, {
	defaultNavigationOptions: defaultHeader
});

const SettingsStack = createStackNavigator({
	SettingsView
}, {
	defaultNavigationOptions: defaultHeader
});

const ChatsDrawer = createDrawerNavigator({
	ChatsStack,
	ProfileStack,
	SettingsStack
}, {
	contentComponent: Sidebar
});

const NewMessageStack = createStackNavigator({
	NewMessageView,
	SelectedUsersViewCreateChannel: SelectedUsersView,
	CreateChannelView
}, {
	defaultNavigationOptions: defaultHeader
});

const InsideStackModal = createStackNavigator({
	Main: ChatsDrawer,
	NewMessageStack
},
{
	mode: 'modal',
	headerMode: 'none'
});

const SetUsernameStack = createStackNavigator({
	SetUsernameView
});

const App = createAppContainer(createSwitchNavigator(
	{
		OutsideStack: OutsideStackModal,
		InsideStack: InsideStackModal,
		AuthLoading: AuthLoadingView,
		SetUsernameStack
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

const onNotification = (notification) => {
	if (notification) {
		const data = notification.getData();
		if (data) {
			try {
				const {
					rid, name, sender, type, host
				} = EJSON.parse(data.ejson);

				const types = {
					c: 'channel', d: 'direct', p: 'group'
				};
				const roomName = type === 'd' ? sender.username : name;

				const params = {
					host,
					rid,
					path: `${ types[type] }/${ roomName }`
				};
				console.log('TCL: onNotification -> params', params);
				store.dispatch(deepLinkingOpen(params));
			} catch (e) {
				console.warn(e);
			}
		}
	}
};

export default class Root extends React.Component {
	constructor(props) {
		super(props);
		// Linking
		// 	.getInitialURL()
		// 	.then((url) => {
		// 		console.log('TCL: Root -> constructor -> url', url);
		// 		if (url) {
		// 			handleOpenURL({ url });
		// 		} else {
		// 			store.dispatch(appInit());
		// 		}
		// 	})
		// 	.catch(e => console.warn(e));
		
		
		// PendingNotifications.getInitialNotification()
		// 	.then((notification) => {
		// 		// this.onNotification(notification);
		// 		if (notification) {
		// 			onNotification(notification);
		// 		} else {
		// 			store.dispatch(appInit());
		// 		}
		// 	})
		// 	.catch(e => console.warn(e));

		this.init();


		Linking.addEventListener('url', handleOpenURL);
	}

	init = async() => {
		const [initial, initialLinking] = await Promise.all([initializePushNotifications(), Linking.getInitialURL()]);
		if (initial) {
			onNotification(initial);
		} else if (initialLinking) {
			handleOpenURL({ url: initialLinking });
		} else {
			store.dispatch(appInit());
		}
		console.log('TCL: Root -> init -> initial', initial);
		console.log('TCL: Root -> init -> initialLinking', initialLinking);
	}

	render() {
		return (
			<Provider store={store}>
				<App
					ref={(navigatorRef) => {
						Navigation.setTopLevelNavigator(navigatorRef);
					}}
				/>
			</Provider>
		);
	}
}

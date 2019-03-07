import React from 'react';
import {
	createStackNavigator, createAppContainer, createSwitchNavigator, createDrawerNavigator
} from 'react-navigation';
import { Provider } from 'react-redux';
import { useScreens } from 'react-native-screens';

import { appInit } from './actions';
import OnboardingView from './views/OnboardingView';
import NewServerView from './views/NewServerView';
import LoginSignupView from './views/LoginSignupView';
import AuthLoadingView from './views/AuthLoadingView';
import RoomsListView from './views/RoomsListView';
import RoomView from './views/RoomView';
import NewMessageView from './views/NewMessageView';
import LoginView from './views/LoginView';
import store from './lib/createStore';
import Navigation from './lib/NewNavigation';
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
import { HEADER_BACKGROUND, HEADER_TITLE } from './constants/colors';

useScreens();

store.dispatch(appInit());
// store.subscribe(this.onStoreUpdate.bind(this));

const defaultHeader = {
	headerStyle: {
		backgroundColor: HEADER_BACKGROUND
	},
	headerTitleStyle: {
		color: HEADER_TITLE
	},
	headerBackTitle: null
};

const OutsideStack = createStackNavigator({
	OnboardingView: {
		screen: OnboardingView,
		header: null
	},
	NewServerView,
	LoginSignupView,
	LoginView
}, {
	defaultNavigationOptions: defaultHeader
});

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
	PinnedMessagesView
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

const ChatsModalStack = createDrawerNavigator({
	ChatsStack,
	ProfileStack,
	SettingsStack
}, {
	contentComponent: Sidebar
});

const InsideStack = createStackNavigator({
	Main: ChatsModalStack,
	NewMessageView
},
{
	mode: 'modal',
	headerMode: 'none'
});

const App = createAppContainer(createSwitchNavigator(
	{
		OutsideStack,
		InsideStack,
		AuthLoading: AuthLoadingView
	},
	{
		initialRouteName: 'AuthLoading'
	}
));

export default () => (
	<Provider store={store}>
		<App
			ref={(navigatorRef) => {
				Navigation.setTopLevelNavigator(navigatorRef);
			}}
		/>
	</Provider>
);

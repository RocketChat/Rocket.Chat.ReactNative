import { Provider } from 'react-redux';
import { AsyncStorage } from 'react-native';
import { Navigation } from 'react-native-navigation';

import RocketChat from './lib/rocketchat';
import store from './lib/createStore';
import { appInit } from './actions';
import database from './lib/realm';

import NewServerView from './views/NewServerView';
import ListServerView from './views/ListServerView';
import LoginSignupView from './views/LoginSignupView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import TermsServiceView from './views/TermsServiceView';
import PrivacyPolicyView from './views/PrivacyPolicyView';
import ForgotPasswordView from './views/ForgotPasswordView';
import RoomsListView from './views/RoomsListView';
import RoomsListHeaderView from './views/RoomsListView/Header';
import RoomView from './views/RoomView';
import RoomInfoView from './views/RoomInfoView';
import RoomInfoEditView from './views/RoomInfoEditView';
import RoomActionsView from './views/RoomActionsView';
import SelectedUsersView from './views/SelectedUsersView';
import RoomHeaderView from './views/RoomView/Header';
import Sidebar from './containers/Sidebar';
import CreateChannelView from './views/CreateChannelView';
import MentionedMessagesView from './views/MentionedMessagesView';
import PinnedMessagesView from './views/PinnedMessagesView';
import ProfileView from './views/ProfileView';
import RoomFilesView from './views/RoomFilesView';
import RoomMembersView from './views/RoomMembersView';
import SearchMessagesView from './views/SearchMessagesView';
import SettingsView from './views/SettingsView';
import SnippetedMessagesView from './views/SnippetedMessagesView';
import StarredMessagesView from './views/StarredMessagesView';
import { iconsLoaded } from './Icons';

function startLogged() {
	Navigation.startSingleScreenApp({
		screen: {
			screen: 'RoomsListView'
		},
		drawer: {
			left: {
				screen: 'Sidebar'
			}
		}
	});
}

function startNotLogged(route) {
	Navigation.startSingleScreenApp({
		screen: {
			screen: route,
			title: route === 'NewServerView' ? 'New Server' : 'Servers'
		}
	});
}

const hasServers = () => {
	const db = database.databases.serversDB.objects('servers');
	return db.length > 0;
};

export async function start() {
	Navigation.registerComponent('NewServerView', () => NewServerView, store, Provider);
	Navigation.registerComponent('ListServerView', () => ListServerView, store, Provider);
	Navigation.registerComponent('LoginSignupView', () => LoginSignupView, store, Provider);
	Navigation.registerComponent('LoginView', () => LoginView, store, Provider);
	Navigation.registerComponent('RegisterView', () => RegisterView, store, Provider);
	Navigation.registerComponent('TermsServiceView', () => TermsServiceView, store, Provider);
	Navigation.registerComponent('PrivacyPolicyView', () => PrivacyPolicyView, store, Provider);
	Navigation.registerComponent('ForgotPasswordView', () => ForgotPasswordView, store, Provider);
	Navigation.registerComponent('RoomsListView', () => RoomsListView, store, Provider);
	Navigation.registerComponent('RoomsListHeaderView', () => RoomsListHeaderView, store, Provider);
	Navigation.registerComponent('Sidebar', () => Sidebar, store, Provider);
	Navigation.registerComponent('RoomView', () => RoomView, store, Provider);
	Navigation.registerComponent('RoomHeaderView', () => RoomHeaderView, store, Provider);
	Navigation.registerComponent('RoomInfoView', () => RoomInfoView, store, Provider);
	Navigation.registerComponent('RoomInfoEditView', () => RoomInfoEditView, store, Provider);
	Navigation.registerComponent('RoomActionsView', () => RoomActionsView, store, Provider);
	Navigation.registerComponent('SelectedUsersView', () => SelectedUsersView, store, Provider);
	Navigation.registerComponent('CreateChannelView', () => CreateChannelView, store, Provider);
	Navigation.registerComponent('MentionedMessagesView', () => MentionedMessagesView, store, Provider);
	Navigation.registerComponent('PinnedMessagesView', () => PinnedMessagesView, store, Provider);
	Navigation.registerComponent('ProfileView', () => ProfileView, store, Provider);
	Navigation.registerComponent('RoomFilesView', () => RoomFilesView, store, Provider);
	Navigation.registerComponent('RoomMembersView', () => RoomMembersView, store, Provider);
	Navigation.registerComponent('SearchMessagesView', () => SearchMessagesView, store, Provider);
	Navigation.registerComponent('SettingsView', () => SettingsView, store, Provider);
	Navigation.registerComponent('SnippetedMessagesView', () => SnippetedMessagesView, store, Provider);
	Navigation.registerComponent('StarredMessagesView', () => StarredMessagesView, store, Provider);

	store.dispatch(appInit());
	await iconsLoaded();

	const token = await AsyncStorage.getItem(RocketChat.TOKEN_KEY);
	if (token) {
		return startLogged();
	}
	if (hasServers()) {
		startNotLogged('ListServerView');
	} else {
		startNotLogged('NewServerView');
	}
}

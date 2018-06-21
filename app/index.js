// import React from 'react';
// import { Provider } from 'react-redux';

// import store from './lib/createStore';

// import Routes from './containers/Routes';

// const RocketChat = () => (
// 	<Provider store={store}>
// 		<Routes />
// 	</Provider>
// );
// import React from 'react';
// import { Provider } from 'react-redux';
import { AsyncStorage } from 'react-native';
import { Navigation } from 'react-native-navigation';

import RocketChat from './lib/rocketchat';
import store from './lib/createStore';
import { appInit } from './actions';

import WithProvider from './views/WithProvider';
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

function startLogged() {
	Navigation.setRoot({
		root: {
			sideMenu: {
				left: {
					component: {
						name: 'Sidebar'
					}
				},
				center: {
					stack: {
						children: [{
							component: {
								id: 'ROOT_STACK',
								name: 'RoomsListView'
							}
						}]
					}
				}
			}
		}
	});
}

function startNotLogged() {
	Navigation.setRoot({
		root: {
			stack: {
				children: [{
					component: {
						name: 'ListServerView'
					}
				}]
			}
		}
	});
}

async function start() {
	Navigation.registerComponent('NewServerView', () => WithProvider(NewServerView, store));
	Navigation.registerComponent('ListServerView', () => WithProvider(ListServerView, store));
	Navigation.registerComponent('LoginSignupView', () => WithProvider(LoginSignupView, store));
	Navigation.registerComponent('LoginView', () => WithProvider(LoginView, store));
	Navigation.registerComponent('RegisterView', () => WithProvider(RegisterView, store));
	Navigation.registerComponent('TermsServiceView', () => WithProvider(TermsServiceView, store));
	Navigation.registerComponent('PrivacyPolicyView', () => WithProvider(PrivacyPolicyView, store));
	Navigation.registerComponent('ForgotPasswordView', () => WithProvider(ForgotPasswordView, store));
	Navigation.registerComponent('RoomsListView', () => WithProvider(RoomsListView, store));
	Navigation.registerComponent('RoomsListHeaderView', () => WithProvider(RoomsListHeaderView, store));
	Navigation.registerComponent('Sidebar', () => WithProvider(Sidebar, store));
	Navigation.registerComponent('RoomView', () => WithProvider(RoomView, store));
	Navigation.registerComponent('RoomHeaderView', () => WithProvider(RoomHeaderView, store));
	Navigation.registerComponent('RoomInfoView', () => WithProvider(RoomInfoView, store));
	Navigation.registerComponent('RoomInfoEditView', () => WithProvider(RoomInfoEditView, store));
	Navigation.registerComponent('RoomActionsView', () => WithProvider(RoomActionsView, store));
	Navigation.registerComponent('SelectedUsersView', () => WithProvider(SelectedUsersView, store));
	Navigation.registerComponent('CreateChannelView', () => WithProvider(CreateChannelView, store));
	Navigation.registerComponent('MentionedMessagesView', () => WithProvider(MentionedMessagesView, store));
	Navigation.registerComponent('PinnedMessagesView', () => WithProvider(PinnedMessagesView, store));
	Navigation.registerComponent('ProfileView', () => WithProvider(ProfileView, store));
	Navigation.registerComponent('RoomFilesView', () => WithProvider(RoomFilesView, store));
	Navigation.registerComponent('RoomMembersView', () => WithProvider(RoomMembersView, store));
	Navigation.registerComponent('SearchMessagesView', () => WithProvider(SearchMessagesView, store));
	Navigation.registerComponent('SettingsView', () => WithProvider(SettingsView, store));
	Navigation.registerComponent('SnippetedMessagesView', () => WithProvider(SnippetedMessagesView, store));
	Navigation.registerComponent('StarredMessagesView', () => WithProvider(StarredMessagesView, store));

	store.dispatch(appInit());

	Navigation.events().registerAppLaunchedListener(async() => {
		const token = await AsyncStorage.getItem(RocketChat.TOKEN_KEY);
		if (token) {
			startLogged();
		}
		startNotLogged();
	});
}

module.exports = {
	start,
	startLogged,
	startNotLogged
};

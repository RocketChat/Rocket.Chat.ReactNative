import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import store from './createStore';

const DRAWER_ID = 'SidebarView';

class NavigationManager {
	constructor() {
		this.views = {
			OnboardingView: {
				name: 'OnboardingView',
				loaded: false,
				require: () => require('../views/OnboardingView').default
			},
			ProfileView: {
				name: 'ProfileView',
				loaded: false,
				require: () => require('../views/ProfileView').default
			},
			RoomsListHeaderView: {
				name: 'RoomsListHeaderView',
				loaded: false,
				require: () => require('../views/RoomsListView/Header').default
			},
			RoomsListView: {
				name: 'RoomsListView',
				loaded: false,
				require: () => require('../views/RoomsListView').default
			},
			RoomView: {
				name: 'RoomView',
				loaded: false,
				require: () => require('../views/RoomView').default
			},
			RoomHeaderView: {
				name: 'RoomHeaderView',
				loaded: false,
				require: () => require('../views/RoomView/Header').default
			},
			SettingsView: {
				name: 'SettingsView',
				loaded: false,
				require: () => require('../views/SettingsView').default
			},
			SidebarView: {
				name: 'SidebarView',
				loaded: false,
				require: () => require('../views/SidebarView').default
			},
			NewServerView: {
				name: 'NewServerView',
				loaded: false,
				require: () => require('../views/NewServerView').default
			},
			CreateChannelView: {
				name: 'CreateChannelView',
				loaded: false,
				require: () => require('../views/CreateChannelView').default
			},
			ForgotPasswordView: {
				name: 'ForgotPasswordView',
				loaded: false,
				require: () => require('../views/ForgotPasswordView').default
			},
			LegalView: {
				name: 'LegalView',
				loaded: false,
				require: () => require('../views/LegalView').default
			},
			LoginSignupView: {
				name: 'LoginSignupView',
				loaded: false,
				require: () => require('../views/LoginSignupView').default
			},
			LoginView: {
				name: 'LoginView',
				loaded: false,
				require: () => require('../views/LoginView').default
			},
			NewMessageView: {
				name: 'NewMessageView',
				loaded: false,
				require: () => require('../views/NewMessageView').default
			},
			OAuthView: {
				name: 'OAuthView',
				loaded: false,
				require: () => require('../views/OAuthView').default
			},
			PrivacyPolicyView: {
				name: 'PrivacyPolicyView',
				loaded: false,
				require: () => require('../views/PrivacyPolicyView').default
			},
			RegisterView: {
				name: 'RegisterView',
				loaded: false,
				require: () => require('../views/RegisterView').default
			},
			SelectedUsersView: {
				name: 'SelectedUsersView',
				loaded: false,
				require: () => require('../views/SelectedUsersView').default
			},
			SetUsernameView: {
				name: 'SetUsernameView',
				loaded: false,
				require: () => require('../views/SetUsernameView').default
			},
			TermsServiceView: {
				name: 'TermsServiceView',
				loaded: false,
				require: () => require('../views/TermsServiceView').default
			},
			MentionedMessagesView: {
				name: 'MentionedMessagesView',
				loaded: false,
				require: () => require('../views/MentionedMessagesView').default
			},
			PinnedMessagesView: {
				name: 'PinnedMessagesView',
				loaded: false,
				require: () => require('../views/PinnedMessagesView').default
			},
			RoomActionsView: {
				name: 'RoomActionsView',
				loaded: false,
				require: () => require('../views/RoomActionsView').default
			},
			RoomFilesView: {
				name: 'RoomFilesView',
				loaded: false,
				require: () => require('../views/RoomFilesView').default
			},
			RoomInfoEditView: {
				name: 'RoomInfoEditView',
				loaded: false,
				require: () => require('../views/RoomInfoEditView').default
			},
			RoomInfoView: {
				name: 'RoomInfoView',
				loaded: false,
				require: () => require('../views/RoomInfoView').default
			},
			RoomMembersView: {
				name: 'RoomMembersView',
				loaded: false,
				require: () => require('../views/RoomMembersView').default
			},
			SearchMessagesView: {
				name: 'SearchMessagesView',
				loaded: false,
				require: () => require('../views/SearchMessagesView').default
			},
			SnippetedMessagesView: {
				name: 'SnippetedMessagesView',
				loaded: false,
				require: () => require('../views/SnippetedMessagesView').default
			},
			StarredMessagesView: {
				name: 'StarredMessagesView',
				loaded: false,
				require: () => require('../views/StarredMessagesView').default
			}
		};
		this.isDrawerVisible = false;

		Navigation.events().registerComponentDidAppearListener(({ componentId }) => {
			if (componentId === DRAWER_ID) {
				this.isDrawerVisible = true;
			}
		});

		Navigation.events().registerComponentDidDisappearListener(({ componentId }) => {
			if (componentId === DRAWER_ID) {
				this.isDrawerVisible = false;
			}
		});
	}

	handleComponentName = (componentName) => {
		if (!componentName) {
			return console.error('componentName not found');
		}
	}

	loadView = (componentName) => {
		const view = this.views[componentName];
		if (!view) {
			return console.error('view not found');
		}
		if (!view.loaded) {
			Navigation.registerComponentWithRedux(view.name, () => gestureHandlerRootHOC(view.require()), Provider, store);
			view.loaded = true;
		}
	}

	push = (...args) => {
		let componentName;
		try {
			componentName = args[1].component.name;
		} catch (error) {
			return console.error(error);
		}
		this.handleComponentName(componentName);
		this.loadView(componentName);
		Navigation.push(...args);
	}

	showModal = (...args) => {
		let componentName;
		try {
			componentName = args[0].stack.children[0].component.name;
		} catch (error) {
			return console.error(error);
		}
		this.handleComponentName(componentName);
		this.loadView(componentName);
		Navigation.showModal(...args);
	}

	pop = (...args) => Navigation.pop(...args);

	popToRoot = (...args) => Navigation.popToRoot(...args);

	dismissModal = (...args) => Navigation.dismissModal(...args);

	dismissAllModals = (...args) => Navigation.dismissAllModals(...args);

	events = (...args) => Navigation.events(...args);

	mergeOptions = (...args) => Navigation.mergeOptions(...args);

	setDefaultOptions = (...args) => Navigation.setDefaultOptions(...args);

	setRoot = (...args) => Navigation.setRoot(...args);

	setStackRoot = (...args) => Navigation.setStackRoot(...args);

	toggleDrawer = () => {
		try {
			const visibility = !this.isDrawerVisible;
			Navigation.mergeOptions(DRAWER_ID, {
				sideMenu: {
					left: {
						visible: visibility
					}
				}
			});
			this.isDrawerVisible = visibility;
		} catch (error) {
			console.warn(error);
		}
	}
}

export default new NavigationManager();

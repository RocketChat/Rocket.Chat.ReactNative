import { put, call, takeLatest, all, select } from 'redux-saga/effects';
import { AsyncStorage } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { Provider } from 'react-redux';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { connectRequest } from '../actions/connect';
import { serverFailure, selectServerRequest, selectServerSuccess } from '../actions/server';
import { setRoles } from '../actions/roles';
import { restoreToken, setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import store from '../lib/createStore';

let LoginSignupView = null;
let LoginView = null;

const getServer = state => state.server.server;
const getToken = state => state.login.token;

const handleSelectServer = function* handleSelectServer({ server }) {
	try {
		// yield put(connectRequest());
		yield AsyncStorage.setItem('currentServer', server);
		// RocketChat.start({ server })

		// const userStringified = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);

		const { token, userStringified } = yield all({
			token: AsyncStorage.getItem(RocketChat.TOKEN_KEY),
			userStringified: AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`)
		});
		console.log("​handleSelectServer -> token, userStringified", token, userStringified);

		if (userStringified) {
			const user = JSON.parse(userStringified);
			yield put(restoreToken(user.token));
			yield put(setUser(user));
			yield put(actions.appStart('inside'));
			// yield put(selectServerRequest(server));
			RocketChat.connect({ server, user });
			// const sortPreferences = yield RocketChat.getSortPreferences();
			// yield put(setAllPreferences(sortPreferences));
		} else {
			RocketChat.connect({ server });
			// yield put(actions.appStart('outside'));
			// TODO: should redirect to currentServer
			// yield RocketChat.clearAsyncStorage();
		}



		// RocketChat.connect(server);
		// const token = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
		// if (token) {
		// 	yield put(actions.appStart('inside'));
		// }

		// yield database.setActiveDB(server);
		// // yield put(connectRequest());

		// yield AsyncStorage.setItem('currentServer', server);

		// const user = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
		// // const parsedUser = JSON.parse(user);
		// // if (parsedUser && parsedUser.token) {
		// // 	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, parsedUser.token);
		// // 	yield put(actions.appStart('inside'));
		// // }

		// const settings = database.objects('settings');
		// yield put(actions.setAllSettings(RocketChat.parseSettings(RocketChat._filterSettings(settings.slice(0, settings.length)))));
		// const emojis = database.objects('customEmojis');
		// yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));
		// const roles = database.objects('roles');
		// yield put(setRoles(roles.reduce((result, role) => {
		// 	result[role._id] = role.description;
		// 	return result;
		// }, {})));

		yield put(selectServerSuccess(server));
	} catch (e) {
		log('handleSelectServer', e);
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		yield RocketChat.testServer(server);
		// TODO: transfer to the component
		const loginServicesLength = yield RocketChat.getLoginServices(server);
		if (loginServicesLength === 0) {
			if (LoginView == null) {
				LoginView = require('../views/LoginView').default;
				Navigation.registerComponentWithRedux('LoginView', () => gestureHandlerRootHOC(LoginView), Provider, store);
			}
			yield Navigation.push('NewServerView', {
				component: {
					name: 'LoginView'
				}
			});
		} else {
			if (LoginSignupView == null) {
				LoginSignupView = require('../views/LoginSignupView').default;
				Navigation.registerComponentWithRedux('LoginSignupView', () => gestureHandlerRootHOC(LoginSignupView), Provider, store);
			}
			yield Navigation.push('NewServerView', {
				component: {
					name: 'LoginSignupView'
				}
			});
		}

		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server }, true);
		});
		yield put(selectServerRequest(server));
	} catch (e) {
		yield put(serverFailure());
		log('handleServerRequest', e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
};
export default root;

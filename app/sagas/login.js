import { AsyncStorage } from 'react-native';
import {
	put, call, takeLatest, select
} from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { serverFinishAdd, serverRequest } from '../actions/server';
import { loginFailure, loginSuccess } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import database from '../lib/realm';
import appConfig from '../../app.json';

const getServer = state => state.server.server;
const loginWithPasswordCall = args => RocketChat.loginWithPassword(args);
const loginCall = args => RocketChat.login(args);
const logoutCall = args => RocketChat.logout(args);

const handleLoginRequest = function* handleLoginRequest({ credentials }) {
	try {
		let result;
		if (credentials.resume) {
			result = yield call(loginCall, credentials);
		} else {
			result = yield call(loginWithPasswordCall, credentials);
		}
		return yield put(loginSuccess(result));
	} catch (error) {
		yield put(loginFailure(error));
	}
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	const adding = yield select(state => state.server.adding);
	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.token);

	const server = yield select(getServer);
	try {
		RocketChat.loginSuccess({ user });
		I18n.locale = user.language;
		yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify(user));
	} catch (error) {
		console.log('loginSuccess saga -> error', error);
	}

	if (!user.username) {
		RocketChat.loginSuccess({ user });
		yield put(appStart('setUsername'));
	} else if (adding) {
		yield put(serverFinishAdd());
		yield put(appStart('inside'));
	} else {
		yield put(appStart('inside'));
	}
};

const handleLogout = function* handleLogout() {
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(logoutCall, { server });
			const { serversDB } = database.databases;
			// all servers
			const servers = yield serversDB.objects('servers');
			// filter logging out server and delete it
			const serverRecord = servers.filtered('id = $0', server);
			serversDB.write(() => {
				serversDB.delete(serverRecord);
			});

			// if there's no servers, go outside
			yield put(serverRequest(appConfig.server));
		} catch (e) {
			yield put(serverRequest(appConfig.server));
			log('err_handle_logout', e);
		}
	}
};

const handleSetUser = function handleSetUser({ user }) {
	if (user && user.language) {
		I18n.locale = user.language;
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, handleLoginSuccess);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);
};
export default root;

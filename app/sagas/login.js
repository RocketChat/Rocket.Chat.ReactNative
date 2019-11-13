import {
	put, call, takeLatest, select, take, fork, cancel
} from 'redux-saga/effects';
import RNUserDefaults from 'rn-user-defaults';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import 'moment/min/locales';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { serverFinishAdd, selectServerRequest } from '../actions/server';
import { loginFailure, loginSuccess, setUser } from '../actions/login';
import { roomsRequest } from '../actions/rooms';
import { toMomentLocale } from '../utils/moment';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import database from '../lib/database';
import EventEmitter from '../utils/events';
import Navigation from '../lib/Navigation';

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

const fetchPermissions = function* fetchPermissions() {
	yield RocketChat.getPermissions();
};

const fetchCustomEmojis = function* fetchCustomEmojis() {
	yield RocketChat.getCustomEmojis();
};

const fetchRoles = function* fetchRoles() {
	yield RocketChat.getRoles();
};

const fetchSlashCommands = function* fetchSlashCommands() {
	yield RocketChat.getSlashCommands();
};

const registerPushToken = function* registerPushToken() {
	yield RocketChat.registerPushToken();
};

const fetchUserPresence = function* fetchUserPresence() {
	yield RocketChat.getUserPresence();
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	try {
		const adding = yield select(state => state.server.adding);
		yield RNUserDefaults.set(RocketChat.TOKEN_KEY, user.token);

		const server = yield select(getServer);
		yield put(roomsRequest());
		yield fork(fetchPermissions);
		yield fork(fetchCustomEmojis);
		yield fork(fetchRoles);
		yield fork(fetchSlashCommands);
		yield fork(registerPushToken);
		yield fork(fetchUserPresence);

		I18n.locale = user.language;
		moment.locale(toMomentLocale(user.language));

		const serversDB = database.servers;
		const usersCollection = serversDB.collections.get('users');
		const u = {
			token: user.token,
			username: user.username,
			name: user.name,
			language: user.language,
			status: user.status,
			roles: user.roles
		};
		yield serversDB.action(async() => {
			try {
				const userRecord = await usersCollection.find(user.id);
				await userRecord.update((record) => {
					record._raw = sanitizedRaw({ id: user.id, ...record._raw }, usersCollection.schema);
					Object.assign(record, u);
				});
			} catch (e) {
				await usersCollection.create((record) => {
					record._raw = sanitizedRaw({ id: user.id }, usersCollection.schema);
					Object.assign(record, u);
				});
			}
		});

		yield RNUserDefaults.set(`${ RocketChat.TOKEN_KEY }-${ server }`, user.id);
		yield put(setUser(user));
		EventEmitter.emit('connected');

		if (!user.username) {
			yield put(appStart('setUsername'));
		} else if (adding) {
			yield put(serverFinishAdd());
			yield put(appStart('inside'));
		} else {
			yield put(appStart('inside'));
		}
	} catch (e) {
		log(e);
	}
};

const handleLogout = function* handleLogout() {
	Navigation.navigate('AuthLoading');
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(logoutCall, { server });
			const serversDB = database.servers;
			// all servers
			const serversCollection = serversDB.collections.get('servers');
			const servers = yield serversCollection.query().fetch();

			// see if there're other logged in servers and selects first one
			if (servers.length > 0) {
				const newServer = servers[0].id;
				const token = yield RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ newServer }`);
				if (token) {
					return yield put(selectServerRequest(newServer));
				}
			}
			// if there's no servers, go outside
			yield put(appStart('outside'));
		} catch (e) {
			yield put(appStart('outside'));
			log(e);
		}
	}
};

const handleSetUser = function handleSetUser({ user }) {
	if (user && user.language) {
		I18n.locale = user.language;
		moment.locale(toMomentLocale(user.language));
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);

	while (true) {
		const params = yield take(types.LOGIN.SUCCESS);
		const loginSuccessTask = yield fork(handleLoginSuccess, params);
		yield take(types.SERVER.SELECT_REQUEST);
		yield cancel(loginSuccessTask);
	}
};
export default root;

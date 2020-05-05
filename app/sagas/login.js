import {
	put, call, takeLatest, select, take, fork, cancel, race, delay
} from 'redux-saga/effects';
import RNUserDefaults from 'rn-user-defaults';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import 'moment/min/locales';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { serverFinishAdd, selectServerRequest } from '../actions/server';
import {
	loginFailure, loginSuccess, setUser, logout
} from '../actions/login';
import { roomsRequest } from '../actions/rooms';
import { toMomentLocale } from '../utils/moment';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import database from '../lib/database';
import EventEmitter from '../utils/events';
import { inviteLinksRequest } from '../actions/inviteLinks';
import { showErrorAlert } from '../utils/info';
import { setActiveUsers } from '../actions/activeUsers';

const getServer = state => state.server.server;
const loginWithPasswordCall = args => RocketChat.loginWithPassword(args);
const loginCall = args => RocketChat.login(args);
const logoutCall = args => RocketChat.logout(args);

const handleLoginRequest = function* handleLoginRequest({ credentials, logoutOnError = false }) {
	try {
		let result;
		if (credentials.resume) {
			result = yield call(loginCall, credentials);
		} else {
			result = yield call(loginWithPasswordCall, credentials);
		}
		if (!result.username) {
			yield put(serverFinishAdd());
			yield put(setUser(result));
			yield put(appStart('setUsername'));
		} else {
			yield put(loginSuccess(result));
		}
	} catch (e) {
		if (logoutOnError && (e.data && e.data.message && /you've been logged out by the server/i.test(e.data.message))) {
			yield put(logout(true));
		} else {
			yield put(loginFailure(e));
		}
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

const fetchUsersPresence = function* fetchUserPresence() {
	yield RocketChat.getUsersPresence();
	RocketChat.subscribeUsersPresence();
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	try {
		const adding = yield select(state => state.server.adding);
		yield RNUserDefaults.set(RocketChat.TOKEN_KEY, user.token);

		RocketChat.getUserPresence(user.id);

		const server = yield select(getServer);
		yield put(roomsRequest());
		yield fork(fetchPermissions);
		yield fork(fetchCustomEmojis);
		yield fork(fetchRoles);
		yield fork(fetchSlashCommands);
		yield fork(registerPushToken);
		yield fork(fetchUsersPresence);

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
			statusText: user.statusText,
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
		yield RNUserDefaults.set(`${ RocketChat.TOKEN_KEY }-${ user.id }`, user.token);
		yield put(setUser(user));
		EventEmitter.emit('connected');

		let currentRoot;
		if (adding) {
			yield put(serverFinishAdd());
			yield put(appStart('inside'));
		} else {
			currentRoot = yield select(state => state.app.root);
			if (currentRoot !== 'inside') {
				yield put(appStart('inside'));
			}
		}

		// after a successful login, check if it's been invited via invite link
		currentRoot = yield select(state => state.app.root);
		if (currentRoot === 'inside') {
			const inviteLinkToken = yield select(state => state.inviteLinks.token);
			if (inviteLinkToken) {
				yield put(inviteLinksRequest(inviteLinkToken));
			}
		}
	} catch (e) {
		log(e);
	}
};

const handleLogout = function* handleLogout({ forcedByServer }) {
	yield put(appStart('loading', I18n.t('Logging_out')));
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(logoutCall, { server });

			// if the user was logged out by the server
			if (forcedByServer) {
				yield put(appStart('outside'));
				showErrorAlert(I18n.t('Logged_out_by_server'), I18n.t('Oops'));
				EventEmitter.emit('NewServer', { server });
			} else {
				const serversDB = database.servers;
				// all servers
				const serversCollection = serversDB.collections.get('servers');
				const servers = yield serversCollection.query().fetch();

				// see if there're other logged in servers and selects first one
				if (servers.length > 0) {
					for (let i = 0; i < servers.length; i += 1) {
						const newServer = servers[i].id;
						const token = yield RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ newServer }`);
						if (token) {
							return yield put(selectServerRequest(newServer));
						}
					}
				}
				// if there's no servers, go outside
				yield put(appStart('outside'));
			}
		} catch (e) {
			yield put(appStart('outside'));
			log(e);
		}
	}
};

const handleSetUser = function* handleSetUser({ user }) {
	if (user && user.language) {
		I18n.locale = user.language;
		moment.locale(toMomentLocale(user.language));
	}

	if (user && user.status) {
		const userId = yield select(state => state.login.user.id);
		yield put(setActiveUsers({ [userId]: user }));
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);

	while (true) {
		const params = yield take(types.LOGIN.SUCCESS);
		const loginSuccessTask = yield fork(handleLoginSuccess, params);
		yield race({
			selectRequest: take(types.SERVER.SELECT_REQUEST),
			timeout: delay(2000)
		});
		yield cancel(loginSuccessTask);
	}
};
export default root;

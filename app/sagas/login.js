import { call, cancel, delay, fork, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions/app';
import { selectServerRequest, serverFinishAdd } from '../actions/server';
import { loginFailure, loginSuccess, logout, setUser } from '../actions/login';
import { roomsRequest } from '../actions/rooms';
import RocketChat from '../lib/rocketchat';
import log, { events, logEvent } from '../utils/log';
import I18n, { setLanguage } from '../i18n';
import database from '../lib/database';
import EventEmitter from '../utils/events';
import { inviteLinksRequest } from '../actions/inviteLinks';
import { showErrorAlert } from '../utils/info';
import { localAuthenticate } from '../utils/localAuthentication';
import { encryptionInit, encryptionStop } from '../actions/encryption';
import UserPreferences from '../lib/userPreferences';
import { inquiryRequest, inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { isOmnichannelStatusAvailable } from '../ee/omnichannel/lib';
import { RootEnum } from '../definitions';

const getServer = state => state.server.server;
const loginWithPasswordCall = args => RocketChat.loginWithPassword(args);
const loginCall = (credentials, isFromWebView) => RocketChat.login(credentials, isFromWebView);
const logoutCall = args => RocketChat.logout(args);

const handleLoginRequest = function* handleLoginRequest({ credentials, logoutOnError = false, isFromWebView = false }) {
	logEvent(events.LOGIN_DEFAULT_LOGIN);
	try {
		let result;
		if (credentials.resume) {
			result = yield loginCall(credentials, isFromWebView);
		} else {
			result = yield call(loginWithPasswordCall, credentials);
		}
		if (!result.username) {
			yield put(serverFinishAdd());
			yield put(setUser(result));
			yield put(appStart({ root: RootEnum.ROOT_SET_USERNAME }));
		} else {
			const server = yield select(getServer);
			yield localAuthenticate(server);

			// Saves username on server history
			const serversDB = database.servers;
			const serversHistoryCollection = serversDB.get('servers_history');
			yield serversDB.action(async () => {
				try {
					const serversHistory = await serversHistoryCollection.query(Q.where('url', server)).fetch();
					if (serversHistory?.length) {
						const serverHistoryRecord = serversHistory[0];
						// this is updating on every login just to save `updated_at`
						// keeping this server as the most recent on autocomplete order
						await serverHistoryRecord.update(s => {
							s.username = result.username;
						});
					}
				} catch (e) {
					log(e);
				}
			});
			yield put(loginSuccess(result));
		}
	} catch (e) {
		if (logoutOnError && e.data && e.data.message && /you've been logged out by the server/i.test(e.data.message)) {
			yield put(logout(true));
		} else {
			logEvent(events.LOGIN_DEFAULT_LOGIN_F);
			yield put(loginFailure(e));
		}
	}
};

const subscribeSettings = function* subscribeSettings() {
	yield RocketChat.subscribeSettings();
};

const fetchPermissions = function* fetchPermissions() {
	yield RocketChat.getPermissions();
};

const fetchCustomEmojis = function* fetchCustomEmojis() {
	yield RocketChat.getCustomEmojis();
};

const fetchRoles = function* fetchRoles() {
	RocketChat.subscribe('stream-roles', 'roles');
	yield RocketChat.getRoles();
};

const fetchSlashCommands = function* fetchSlashCommands() {
	yield RocketChat.getSlashCommands();
};

const registerPushToken = function* registerPushToken() {
	yield RocketChat.registerPushToken();
};

const fetchUsersPresence = function* fetchUserPresence() {
	RocketChat.subscribeUsersPresence();
};

const fetchEnterpriseModules = function* fetchEnterpriseModules({ user }) {
	yield RocketChat.getEnterpriseModules();

	if (isOmnichannelStatusAvailable(user) && RocketChat.isOmnichannelModuleAvailable()) {
		yield put(inquiryRequest());
	}
};

const fetchRooms = function* fetchRooms() {
	yield put(roomsRequest());
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	try {
		RocketChat.getUserPresence(user.id);

		const server = yield select(getServer);
		yield fork(fetchRooms);
		yield fork(fetchPermissions);
		yield fork(fetchCustomEmojis);
		yield fork(fetchRoles);
		yield fork(fetchSlashCommands);
		yield fork(registerPushToken);
		yield fork(fetchUsersPresence);
		yield fork(fetchEnterpriseModules, { user });
		yield fork(subscribeSettings);
		yield put(encryptionInit());

		setLanguage(user?.language);

		const serversDB = database.servers;
		const usersCollection = serversDB.get('users');
		const u = {
			token: user.token,
			username: user.username,
			name: user.name,
			language: user.language,
			status: user.status,
			statusText: user.statusText,
			roles: user.roles,
			isFromWebView: user.isFromWebView,
			showMessageInMainThread: user.showMessageInMainThread,
			avatarETag: user.avatarETag
		};
		yield serversDB.action(async () => {
			try {
				const userRecord = await usersCollection.find(user.id);
				await userRecord.update(record => {
					record._raw = sanitizedRaw({ id: user.id, ...record._raw }, usersCollection.schema);
					Object.assign(record, u);
				});
			} catch (e) {
				await usersCollection.create(record => {
					record._raw = sanitizedRaw({ id: user.id }, usersCollection.schema);
					Object.assign(record, u);
				});
			}
		});

		yield UserPreferences.setStringAsync(`${RocketChat.TOKEN_KEY}-${server}`, user.id);
		yield UserPreferences.setStringAsync(`${RocketChat.TOKEN_KEY}-${user.id}`, user.token);
		yield put(setUser(user));
		EventEmitter.emit('connected');

		yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
		const inviteLinkToken = yield select(state => state.inviteLinks.token);
		if (inviteLinkToken) {
			yield put(inviteLinksRequest(inviteLinkToken));
		}
	} catch (e) {
		log(e);
	}
};

const handleLogout = function* handleLogout({ forcedByServer }) {
	yield put(encryptionStop());
	yield put(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Logging_out') }));
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(logoutCall, { server });

			// if the user was logged out by the server
			if (forcedByServer) {
				yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				showErrorAlert(I18n.t('Logged_out_by_server'), I18n.t('Oops'));
				yield delay(300);
				EventEmitter.emit('NewServer', { server });
			} else {
				const serversDB = database.servers;
				// all servers
				const serversCollection = serversDB.get('servers');
				const servers = yield serversCollection.query().fetch();

				// see if there're other logged in servers and selects first one
				if (servers.length > 0) {
					for (let i = 0; i < servers.length; i += 1) {
						const newServer = servers[i].id;
						const token = yield UserPreferences.getStringAsync(`${RocketChat.TOKEN_KEY}-${newServer}`);
						if (token) {
							yield put(selectServerRequest(newServer));
							return;
						}
					}
				}
				// if there's no servers, go outside
				yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			}
		} catch (e) {
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			log(e);
		}
	}
};

const handleSetUser = function* handleSetUser({ user }) {
	setLanguage(user?.language);

	if (user?.statusLivechat && RocketChat.isOmnichannelModuleAvailable()) {
		if (isOmnichannelStatusAvailable(user)) {
			yield put(inquiryRequest());
		} else {
			yield put(inquiryReset());
		}
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

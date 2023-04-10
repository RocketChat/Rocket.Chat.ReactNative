import { call, cancel, delay, fork, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions/app';
import { selectServerRequest, serverFinishAdd } from '../actions/server';
import { loginFailure, loginSuccess, logout as logoutAction, setUser } from '../actions/login';
import { roomsRequest } from '../actions/rooms';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import I18n, { setLanguage } from '../i18n';
import database from '../lib/database';
import EventEmitter from '../lib/methods/helpers/events';
import { inviteLinksRequest } from '../actions/inviteLinks';
import { showErrorAlert } from '../lib/methods/helpers/info';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import { encryptionInit, encryptionStop } from '../actions/encryption';
import UserPreferences from '../lib/methods/userPreferences';
import { inquiryRequest, inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { isOmnichannelStatusAvailable } from '../ee/omnichannel/lib';
import { RootEnum } from '../definitions';
import sdk from '../lib/services/sdk';
import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants';
import {
	getCustomEmojis,
	getEnterpriseModules,
	getPermissions,
	getRoles,
	getSlashCommands,
	getUserPresence,
	isOmnichannelModuleAvailable,
	logout,
	removeServerData,
	removeServerDatabase,
	subscribeSettings,
	subscribeUsersPresence
} from '../lib/methods';
import { Services } from '../lib/services';

const getServer = state => state.server.server;
const loginWithPasswordCall = args => Services.loginWithPassword(args);
const loginCall = (credentials, isFromWebView) => Services.login(credentials, isFromWebView);
const logoutCall = args => logout(args);

const handleLoginRequest = function* handleLoginRequest({
	credentials,
	logoutOnError = false,
	isFromWebView = false,
	registerCustomFields
}) {
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
			if (registerCustomFields) {
				const updatedUser = yield call(Services.saveUserProfile, {}, { ...registerCustomFields });
				yield put(setUser({ ...result, ...updatedUser.user }));
			}
		}
	} catch (e) {
		if (e?.data?.message && /you've been logged out by the server/i.test(e.data.message)) {
			yield put(logoutAction(true, 'Logged_out_by_server'));
		} else if (e?.data?.message && /your session has expired/i.test(e.data.message)) {
			yield put(logoutAction(true, 'Token_expired'));
		} else {
			logEvent(events.LOGIN_DEFAULT_LOGIN_F);
			yield put(loginFailure(e));
		}
	}
};

const subscribeSettingsFork = function* subscribeSettingsFork() {
	yield subscribeSettings();
};

const fetchPermissionsFork = function* fetchPermissionsFork() {
	yield getPermissions();
};

const fetchCustomEmojisFork = function* fetchCustomEmojisFork() {
	yield getCustomEmojis();
};

const fetchRolesFork = function* fetchRolesFork() {
	sdk.subscribe('stream-roles', 'roles');
	yield getRoles();
};

const fetchSlashCommandsFork = function* fetchSlashCommandsFork() {
	yield getSlashCommands();
};

const registerPushTokenFork = function* registerPushTokenFork() {
	yield Services.registerPushToken();
};

const fetchUsersPresenceFork = function* fetchUsersPresenceFork() {
	subscribeUsersPresence();
};

const fetchEnterpriseModulesFork = function* fetchEnterpriseModulesFork({ user }) {
	yield getEnterpriseModules();

	if (isOmnichannelStatusAvailable(user) && isOmnichannelModuleAvailable()) {
		yield put(inquiryRequest());
	}
};

const fetchRoomsFork = function* fetchRoomsFork() {
	yield put(roomsRequest());
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	try {
		getUserPresence(user.id);

		const server = yield select(getServer);
		yield fork(fetchRoomsFork);
		yield fork(fetchPermissionsFork);
		yield fork(fetchCustomEmojisFork);
		yield fork(fetchRolesFork);
		yield fork(fetchSlashCommandsFork);
		yield fork(registerPushTokenFork);
		yield fork(fetchUsersPresenceFork);
		yield fork(fetchEnterpriseModulesFork, { user });
		yield fork(subscribeSettingsFork);
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

		UserPreferences.setString(`${TOKEN_KEY}-${server}`, user.id);
		UserPreferences.setString(`${TOKEN_KEY}-${user.id}`, user.token);
		UserPreferences.setString(CURRENT_SERVER, server);
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

const handleLogout = function* handleLogout({ forcedByServer, message }) {
	yield put(encryptionStop());
	yield put(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Logging_out') }));
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(logoutCall, { server });

			// if the user was logged out by the server
			if (forcedByServer) {
				yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
				if (message) {
					showErrorAlert(I18n.t(message), I18n.t('Oops'));
				}
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
						const token = UserPreferences.getString(`${TOKEN_KEY}-${newServer}`);
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
	if ('avatarETag' in user) {
		const userId = yield select(state => state.login.user.id);
		const serversDB = database.servers;
		const userCollections = serversDB.get('users');
		yield serversDB.write(async () => {
			try {
				const userRecord = await userCollections.find(userId);
				await userRecord.update(record => {
					record.avatarETag = user.avatarETag;
				});
			} catch {
				//
			}
		});
	}

	setLanguage(user?.language);

	if (user?.statusLivechat && isOmnichannelModuleAvailable()) {
		if (isOmnichannelStatusAvailable(user)) {
			yield put(inquiryRequest());
		} else {
			yield put(inquiryReset());
		}
	}
};

const handleDeleteAccount = function* handleDeleteAccount() {
	yield put(encryptionStop());
	yield put(appStart({ root: RootEnum.ROOT_LOADING, text: I18n.t('Deleting_account') }));
	const server = yield select(getServer);
	if (server) {
		try {
			yield call(removeServerData, { server });
			yield call(removeServerDatabase, { server });
			const serversDB = database.servers;
			// all servers
			const serversCollection = serversDB.get('servers');
			const servers = yield serversCollection.query().fetch();

			// see if there're other logged in servers and selects first one
			if (servers.length > 0) {
				for (let i = 0; i < servers.length; i += 1) {
					const newServer = servers[i].id;
					const token = UserPreferences.getString(`${TOKEN_KEY}-${newServer}`);
					if (token) {
						yield put(selectServerRequest(newServer));
						return;
					}
				}
			}
			// if there's no servers, go outside
			sdk.disconnect();
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} catch (e) {
			sdk.disconnect();
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			log(e);
		}
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);
	yield takeLatest(types.DELETE_ACCOUNT, handleDeleteAccount);

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

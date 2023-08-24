import { put, takeLatest, select } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

import Navigation from '../lib/navigation/appNavigation';
import { SERVER } from '../actions/actionsTypes';
import { selectServerFailure, selectServerRequest, selectServerSuccess, serverFailure } from '../actions/server';
import { clearSettings } from '../actions/settings';
import { clearUser, setUser } from '../actions/login';
import { clearActiveUsers } from '../actions/activeUsers';
import database from '../lib/database';
import log, { logServerVersion } from '../lib/methods/helpers/log';
import I18n from '../i18n';
import { BASIC_AUTH_KEY, setBasicAuth } from '../lib/methods/helpers/fetch';
import { appStart } from '../actions/app';
import UserPreferences from '../lib/methods/userPreferences';
import { encryptionStop } from '../actions/encryption';
import SSLPinning from '../lib/methods/helpers/sslPinning';
import { inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { RootEnum } from '../definitions';
import { CERTIFICATE_KEY, CURRENT_SERVER, TOKEN_KEY } from '../lib/constants';
import { getLoginSettings, setCustomEmojis, setEnterpriseModules, setPermissions, setRoles, setSettings } from '../lib/methods';
import { Services } from '../lib/services';
import { connect } from '../lib/services/connect';
import supportedVersionsBuild from '../../app-supportedversions.json';

const checkServerVersionCompatibility = function* (serverInfo) {
	if (!serverInfo.supportedVersions || serverInfo.supportedVersions.timestamp < supportedVersionsBuild.timestamp) {
		const versionInfo = supportedVersionsBuild.versions.find(({ version }) => version === serverInfo.version);
		if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
			return false;
		}
	}

	const versionInfo = serverInfo.supportedVersions.versions.find(({ version }) => version === serverInfo.version);
	if (!versionInfo) {
		return false;
	}

	if (new Date(versionInfo.expiration) < new Date()) {
		const exception = serverInfo.supportedVersions.exceptions.versions.find(({ version }) => version === serverInfo.version);
		if (!exception || new Date(exception.expiration) < new Date()) {
			return false;
		}
	}

	return true;
};

const getServerById = function* (server) {
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	try {
		const record = yield serversCollection.find(server);
		return record;
	} catch (error) {
		return null;
	}
};

const upsertServer = function* ({ serverInfo }) {
	let serverVersion = valid(serverInfo.version);
	if (!serverVersion) {
		({ version: serverVersion } = coerce(serverInfo.version));
	}
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');

	let record = yield getServerById(serverInfo.server);
	try {
		if (record) {
			yield serversDB.action(async () => {
				await record.update(record => {
					record.version = serverVersion;
					if (serverInfo.supportedVersions?.timestamp > record.supportedVersions?.timestamp) {
						record.supportedVersions = serverInfo.supportedVersions;
					}
				});
			});
			return record;
		}

		yield serversDB.action(async () => {
			record = await serversCollection.create(record => {
				record._raw = sanitizedRaw({ id: serverInfo.server }, serversCollection.schema);
				record.supportedVersions = serverInfo.supportedVersions;
				record.version = serverVersion;
			});
		});
		return record;
	} catch (e) {
		console.error(e);
	}
};

const getServerInfo = function* getServerInfo({ server, raiseError = true }) {
	try {
		const serverInfoResult = yield Services.getServerInfo(server);
		let websocketInfo = { success: true };
		if (raiseError) {
			websocketInfo = yield Services.getWebsocketInfo({ server });
		}

		if (!serverInfoResult.success || !websocketInfo.success) {
			if (raiseError) {
				const info = serverInfoResult.success ? websocketInfo : serverInfoResult;
				Alert.alert(I18n.t('Oops'), info.message);
			}
			yield put(serverFailure());
			return;
		}

		const serverRecord = yield upsertServer({ serverInfo: serverInfoResult });

		const isCompatible = yield checkServerVersionCompatibility(serverRecord);
		if (!isCompatible) {
			// if (raiseError) {
			Alert.alert(I18n.t('Oops'), 'Nope');
			// }
			yield put(serverFailure());
			return;
		}

		return serverInfoResult;
	} catch (e) {
		log(e);
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		SSLPinning.setCertificate(certificate, server);
		yield put(inquiryReset());
		yield put(encryptionStop());
		yield put(clearActiveUsers());
		const serversDB = database.servers;
		const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
		const userCollections = serversDB.get('users');
		let user = null;
		if (userId) {
			try {
				// search credentials on database
				const userRecord = yield userCollections.find(userId);
				user = {
					id: userRecord.id,
					token: userRecord.token,
					username: userRecord.username,
					name: userRecord.name,
					language: userRecord.language,
					status: userRecord.status,
					statusText: userRecord.statusText,
					roles: userRecord.roles,
					avatarETag: userRecord.avatarETag,
					bio: userRecord.bio,
					nickname: userRecord.nickname
				};
			} catch {
				// search credentials on shared credentials (Experimental/Official)
				const token = UserPreferences.getString(`${TOKEN_KEY}-${userId}`);
				if (token) {
					user = { token };
				}
			}
		}

		const basicAuth = UserPreferences.getString(`${BASIC_AUTH_KEY}-${server}`);
		setBasicAuth(basicAuth);

		if (user) {
			yield put(clearSettings());
			yield put(setUser(user));
			yield connect({ server, logoutOnError: true });
			yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
			UserPreferences.setString(CURRENT_SERVER, server); // only set server after have a user
		} else {
			yield put(clearUser());
			yield connect({ server });
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		}

		// We can't use yield here because fetch of Settings & Custom Emojis is slower
		// and block the selectServerSuccess raising multiples errors
		setSettings();
		setCustomEmojis();
		setPermissions();
		setRoles();
		setEnterpriseModules();

		let serverInfo;
		if (fetchVersion) {
			serverInfo = yield getServerInfo({ server, raiseError: false });
		}

		// Return server version even when offline
		const serverVersion = (serverInfo && serverInfo.version) || version;

		// we'll set serverVersion as metadata for bugsnag
		logServerVersion(serverVersion);
		yield put(selectServerSuccess(server, serverVersion));
	} catch (e) {
		yield put(selectServerFailure());
		log(e);
	}
};

const handleServerRequest = function* handleServerRequest({ server, username, fromServerHistory }) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		SSLPinning.setCertificate(certificate, server);

		const serverInfo = yield getServerInfo({ server });
		const serversDB = database.servers;
		const serversHistoryCollection = serversDB.get('servers_history');

		if (serverInfo) {
			yield Services.getLoginServices(server);
			yield getLoginSettings({ server });
			Navigation.navigate('WorkspaceView');

			const Accounts_iframe_enabled = yield select(state => state.settings.Accounts_iframe_enabled);
			if (fromServerHistory && !Accounts_iframe_enabled) {
				Navigation.navigate('LoginView', { username });
			}

			yield serversDB.action(async () => {
				try {
					const serversHistory = await serversHistoryCollection.query(Q.where('url', server)).fetch();
					if (!serversHistory?.length) {
						await serversHistoryCollection.create(s => {
							s.url = server;
						});
					}
				} catch (e) {
					log(e);
				}
			});
			yield put(selectServerRequest(server, serverInfo.version, false));
		}
	} catch (e) {
		yield put(serverFailure());
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
};
export default root;

import { put, takeLatest } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';
import { call } from 'typed-redux-saga';

import Navigation from '../lib/navigation/appNavigation';
import { SERVER } from '../actions/actionsTypes';
import {
	ISelectServerAction,
	IServerRequestAction,
	selectServerFailure,
	selectServerRequest,
	selectServerSuccess,
	serverFailure
} from '../actions/server';
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
import { IServerInfo, RootEnum, TServerModel } from '../definitions';
import { CERTIFICATE_KEY, CURRENT_SERVER, TOKEN_KEY } from '../lib/constants';
import { getLoginSettings, setCustomEmojis, setEnterpriseModules, setPermissions, setRoles, setSettings } from '../lib/methods';
import { Services } from '../lib/services';
import { connect } from '../lib/services/connect';
import supportedVersionsBuild from '../../app-supportedversions.json';
import { appSelector } from '../lib/hooks';

const checkServerVersionCompatibility = function (server: TServerModel) {
	if (!server.supportedVersions || server.supportedVersions.timestamp < supportedVersionsBuild.timestamp) {
		const versionInfo = supportedVersionsBuild.versions.find(({ version }) => version === server.version);
		if (!versionInfo || new Date(versionInfo.expiration) < new Date()) {
			return false;
		}
	}

	const versionInfo = server.supportedVersions.versions.find(({ version }) => version === server.version);
	if (!versionInfo) {
		return false;
	}

	if (new Date(versionInfo.expiration) < new Date()) {
		const exception = server.supportedVersions.exceptions?.versions.find(({ version }) => version === server.version);
		if (!exception || new Date(exception.expiration) < new Date()) {
			return false;
		}
	}

	return true;
};

const getServerById = async function (server: string) {
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	try {
		const record = await serversCollection.find(server);
		return record;
	} catch (error) {
		return null;
	}
};

const getServerVersion = function (version: string | null) {
	let validVersion = valid(version);
	if (validVersion) {
		return validVersion;
	}
	const coercedVersion = coerce(version);
	if (coercedVersion) {
		validVersion = valid(coercedVersion);
	}
	if (validVersion) {
		return validVersion;
	}
	throw new Error('Server version not found');
};

const upsertServer = async function ({ server, serverInfo }: { server: string; serverInfo: IServerInfo }): Promise<TServerModel> {
	console.log('🚀 ~ file: selectServer.ts:72 ~ upsertServer ~ serverInfo:', serverInfo);
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');

	const serverVersion = getServerVersion(serverInfo.version);
	const record = await getServerById(server);
	if (record) {
		await serversDB.write(async () => {
			await record.update(r => {
				r.version = serverVersion;
				if (serverInfo.supportedVersions?.timestamp && serverInfo.supportedVersions.timestamp > r.supportedVersions?.timestamp) {
					r.supportedVersions = serverInfo.supportedVersions;
				}
			});
		});
		return record;
	}

	let newRecord;
	await serversDB.write(async () => {
		newRecord = await serversCollection.create(r => {
			r._raw = sanitizedRaw({ id: server }, serversCollection.schema);
			if (serverInfo.supportedVersions) {
				r.supportedVersions = serverInfo.supportedVersions;
			}
			r.version = serverVersion;
		});
	});
	if (newRecord) {
		return newRecord;
	}
	throw new Error('Error creating server record');
};

const getServerInfo = function* getServerInfo({ server, raiseError = true }: { server: string; raiseError?: boolean }) {
	try {
		const serverInfoResult = yield* call(Services.getServerInfo, server);
		if (raiseError) {
			if (!serverInfoResult.success) {
				Alert.alert(I18n.t('Oops'), serverInfoResult.message);
				yield put(serverFailure(serverInfoResult.message));
				return;
			}
			const websocketInfo = yield* call(Services.getWebsocketInfo, { server });
			if (!websocketInfo.success) {
				Alert.alert(I18n.t('Oops'), websocketInfo.message);
				yield put(serverFailure(websocketInfo.message));
				return;
			}
		}

		// TODO: Review raiseError logic
		if (!serverInfoResult.success) {
			yield put(serverFailure('TBD 1'));
			return;
		}

		const serverRecord = yield* call(upsertServer, { server, serverInfo: serverInfoResult });
		const isCompatible = yield* call(checkServerVersionCompatibility, serverRecord);
		if (!isCompatible) {
			// if (raiseError) {
			Alert.alert(I18n.t('Oops'), 'Nope');
			// }
			yield put(serverFailure('TBD 2'));
			return;
		}

		return serverInfoResult;
	} catch (e) {
		log(e);
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }: ISelectServerAction) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		if (certificate) {
			SSLPinning?.setCertificate(certificate, server);
		}
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
				const userRecord = yield* call(userCollections.find, userId);
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
			serverInfo = yield* getServerInfo({ server, raiseError: false });
		}

		// Return server version even when offline
		const serverVersion = (serverInfo && serverInfo.version) || (version as string);

		// we'll set serverVersion as metadata for bugsnag
		logServerVersion(serverVersion);
		yield put(selectServerSuccess(server, serverVersion));
	} catch (e) {
		yield put(selectServerFailure());
		log(e);
	}
};

const handleServerRequest = function* handleServerRequest({ server, username, fromServerHistory }: IServerRequestAction) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		if (certificate) {
			SSLPinning?.setCertificate(certificate, server);
		}

		const serverInfo = yield* getServerInfo({ server });
		const serversDB = database.servers;
		const serversHistoryCollection = serversDB.get('servers_history');

		if (serverInfo) {
			yield Services.getLoginServices(server);
			yield getLoginSettings({ server });
			Navigation.navigate('WorkspaceView');

			const Accounts_iframe_enabled = yield* appSelector(state => state.settings.Accounts_iframe_enabled);
			if (fromServerHistory && !Accounts_iframe_enabled) {
				Navigation.navigate('LoginView', { username });
			}

			yield serversDB.write(async () => {
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
		yield put(serverFailure(e));
		log(e);
	}
};

const root = function* root() {
	yield takeLatest<IServerRequestAction>(SERVER.REQUEST, handleServerRequest);
	yield takeLatest<ISelectServerAction>(SERVER.SELECT_REQUEST, handleSelectServer);
};
export default root;

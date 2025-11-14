import { put, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';
import { call } from 'typed-redux-saga';

import Navigation from '../lib/navigation/appNavigation';
import { SERVER } from '../actions/actionsTypes';
import {
	type ISelectServerAction,
	type IServerRequestAction,
	selectServerCancel,
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
import { setSupportedVersions } from '../actions/supportedVersions';
import UserPreferences from '../lib/methods/userPreferences';
import { encryptionStop } from '../actions/encryption';
import { inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { type IServerInfo, RootEnum, type TServerModel } from '../definitions';
import { CERTIFICATE_KEY, CURRENT_SERVER, TOKEN_KEY } from '../lib/constants/keys';
import { checkSupportedVersions } from '../lib/methods/checkSupportedVersions';
import { getLoginSettings, setSettings } from '../lib/methods/getSettings';
import { getServerInfo } from '../lib/methods/getServerInfo';
import { setCustomEmojis } from '../lib/methods/getCustomEmojis';
import { setEnterpriseModules } from '../lib/methods/enterpriseModules';
import { setPermissions } from '../lib/methods/getPermissions';
import { setRoles } from '../lib/methods/getRoles';
import { connect, disconnect, getWebsocketInfo, getLoginServices } from '../lib/services/connect';
import sdk from '../lib/services/sdk';
import { appSelector } from '../lib/hooks/useAppSelector';
import { getServerById } from '../lib/database/services/Server';
import { getLoggedUserById } from '../lib/database/services/LoggedUser';
import SSLPinning from '../lib/methods/helpers/sslPinning';

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
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');
	const serverVersion = getServerVersion(serverInfo.version);
	const record = await getServerById(server);
	if (record) {
		await serversDB.write(async () => {
			await record.update(r => {
				r.version = serverVersion;
				if (serverInfo.supportedVersions) {
					r.supportedVersions = serverInfo.supportedVersions;
					r.supportedVersionsUpdatedAt = new Date();
				}
			});
		});
		return record;
	}

	let newRecord;
	await serversDB.write(async () => {
		newRecord = await serversCollection.create(r => {
			r._raw = sanitizedRaw({ id: server }, serversCollection.schema);
			r.version = serverVersion;
			if (serverInfo.supportedVersions) {
				r.supportedVersions = serverInfo.supportedVersions;
				r.supportedVersionsUpdatedAt = new Date();
			}
		});
	});
	if (newRecord) {
		return newRecord;
	}
	throw new Error('Error creating server record');
};

const getServerInfoSaga = function* getServerInfoSaga({ server, raiseError = true }: { server: string; raiseError?: boolean }) {
	try {
		const serverInfoResult = yield* call(getServerInfo, server);
		if (raiseError) {
			if (!serverInfoResult.success) {
				yield put(serverFailure(I18n.t('Invalid_URL')));
				return;
			}
			const websocketInfo = yield* call(getWebsocketInfo, { server });
			if (!websocketInfo.success) {
				yield put(serverFailure(I18n.t('Invalid_URL')));
				return;
			}
		}

		let serverRecord: TServerModel | null;
		if (serverInfoResult.success) {
			serverRecord = yield* call(upsertServer, { server, serverInfo: serverInfoResult });
		} else {
			serverRecord = yield* call(getServerById, server);
		}
		if (!serverRecord) {
			throw new Error('Server not found');
		}
		const supportedVersionsResult = yield* call(checkSupportedVersions, {
			supportedVersions: serverRecord.supportedVersions,
			serverVersion: serverRecord.version
		});
		yield put(setSupportedVersions(supportedVersionsResult));

		if (supportedVersionsResult.status === 'expired') {
			disconnect();
		}

		return serverRecord;
	} catch (e) {
		log(e);
		yield put(serverFailure());
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }: ISelectServerAction) {
	try {
		if (sdk.current?.connection?.url === server) {
			yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
			yield put(selectServerCancel());
			return;
		}
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		if (certificate) {
			SSLPinning?.setCertificate(certificate, server);
		}
		yield put(inquiryReset());
		yield put(encryptionStop());
		yield put(clearActiveUsers());
		const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
		let user = null;
		if (userId) {
			// search credentials on database
			const userRecord = yield* call(getLoggedUserById, userId);
			if (userRecord) {
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
					nickname: userRecord.nickname,
					requirePasswordChange: userRecord.requirePasswordChange
				};
			} else {
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
			const currentRoot = yield* appSelector(state => state.app.root);
			if (currentRoot !== RootEnum.ROOT_SHARE_EXTENSION && currentRoot !== RootEnum.ROOT_LOADING_SHARE_EXTENSION) {
				yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
			}
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

		// We need uniqueId from settings to get cloud info, so setSettings needs to be called first
		let serverInfo;
		if (fetchVersion) {
			serverInfo = yield* getServerInfoSaga({ server, raiseError: false });
		}

		// Return server version even when offline
		const serverVersion = serverInfo?.version || version;

		// we'll set serverVersion as metadata for bugsnag
		logServerVersion(serverVersion);
		yield put(selectServerSuccess({ server, version: serverVersion, name: serverInfo?.name || 'Rocket.Chat' }));
	} catch (e) {
		yield put(selectServerFailure());
		log(e);
	}
};

const handleServerRequest = function* handleServerRequest({ server, username, fromServerHistory }: IServerRequestAction) {
	try {
		const certificate = UserPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		if (certificate) {
			SSLPinning?.setCertificate(certificate, server);
		}
		const serverInfo = yield* getServerInfoSaga({ server });
		const serversDB = database.servers;
		const serversHistoryCollection = serversDB.get('servers_history');

		if (serverInfo) {
			yield getLoginServices(server);
			yield getLoginSettings({ server, serverVersion: serverInfo.version });
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
		yield put(serverFailure());
		log(e);
	}
};

const root = function* root() {
	yield takeLatest<IServerRequestAction>(SERVER.REQUEST, handleServerRequest);
	yield takeLatest<ISelectServerAction>(SERVER.SELECT_REQUEST, handleSelectServer);
};
export default root;

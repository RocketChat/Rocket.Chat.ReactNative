import { rsaImportPublicKey, rsaVerifyJwt } from '@rocket.chat/mobile-crypto';

import dayjs from '../dayjs';
import { getSupportedVersionsCloud } from '../services/restApi';
import { type TCloudInfo, type IServerInfo, type ISupportedVersionsData, type IApiServerInfo } from '~/definitions/IServer';
import { selectServerFailure } from '~/actions/server';
import { store } from '../store/auxStore';
import I18n from '~/i18n';
import { SIGNED_SUPPORTED_VERSIONS_PUBLIC_KEY } from '../constants/supportedVersions';
import { getServerById } from '../database/services/Server';
import { compareServerVersion } from './helpers/compareServerVersion';
import log from './helpers/log';
import { fetchForWorkspace } from './serverBasicAuth';
import { getStoredSession } from './loggedInServer';

interface IServerInfoFailure {
	success: false;
	message: string;
}

interface IServerInfoSuccess extends IServerInfo {
	success: true;
}

export type TServerInfoResult = IServerInfoSuccess | IServerInfoFailure;

const SV_CLOUD_UPDATE_INTERVAL = 12; // hours

const verifyJWT = async (jwt?: string): Promise<ISupportedVersionsData | null> => {
	if (!jwt) {
		return null;
	}
	try {
		const payload = await rsaVerifyJwt(await rsaImportPublicKey(SIGNED_SUPPORTED_VERSIONS_PUBLIC_KEY), jwt);
		return JSON.parse(payload) as ISupportedVersionsData;
	} catch {
		return null;
	}
};

const getSessionHeaders = (server: string) => {
	const { userId, token } = getStoredSession(server);
	return userId && token ? { 'X-Auth-Token': token, 'X-User-Id': userId } : {};
};

export async function getServerInfo(server: string, signal?: AbortSignal): Promise<TServerInfoResult> {
	try {
		const response = await fetchForWorkspace(server, `${server}/api/info`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', ...getSessionHeaders(server) },
			signal
		});
		try {
			const serverInfo: IApiServerInfo = await response.json();
			if (!serverInfo?.success) {
				return {
					success: false,
					message: I18n.t('Not_RC_Server')
				};
			}

			const supportedVersions =
				(await verifyJWT(serverInfo.supportedVersions?.signed)) ??
				(await getCloudSupportedVersions(server, serverInfo.version, signal));

			return {
				...serverInfo,
				success: true,
				supportedVersions
			};
		} catch (error) {
			// Request is successful, but response isn't a json
		}
	} catch (e: any) {
		if (e?.message && !signal?.aborted) {
			if (e.message === 'Aborted') {
				store.dispatch(selectServerFailure());
				throw e;
			}
			return {
				success: false,
				message: I18n.t('Not_RC_Server')
			};
		}
	}

	return {
		success: false,
		message: I18n.t('Not_RC_Server')
	};
}

const getUniqueId = async (server: string, serverVersion: string, signal?: AbortSignal): Promise<string> => {
	const url = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')
		? `${server}/api/v1/settings.public?_id=uniqueID`
		: `${server}/api/v1/settings.public?query={"_id": "uniqueID"}`;
	const response = await fetchForWorkspace(server, url, { signal });
	const result = await response.json();
	return result?.settings?.[0]?.value;
};

export const getCloudInfo = async (domain: string, serverVersion: string, signal?: AbortSignal): Promise<TCloudInfo | null> => {
	try {
		const uniqueId = await getUniqueId(domain, serverVersion, signal);
		const response = await getSupportedVersionsCloud(uniqueId, domain, signal);
		return response.json() as unknown as TCloudInfo;
	} catch (e) {
		if (!signal?.aborted) {
			log(e);
		}
		return null;
	}
};

const getCloudSupportedVersions = async (
	server: string,
	serverVersion: string,
	signal?: AbortSignal
): Promise<ISupportedVersionsData | null> => {
	const serverRecord = await getServerById(server);
	if (
		serverRecord?.supportedVersionsUpdatedAt &&
		dayjs(new Date()).diff(serverRecord.supportedVersionsUpdatedAt, 'hours') <= SV_CLOUD_UPDATE_INTERVAL
	) {
		return null;
	}
	const cloudInfo = await getCloudInfo(server, serverVersion, signal);
	return cloudInfo ? verifyJWT(cloudInfo.signed) : null;
};

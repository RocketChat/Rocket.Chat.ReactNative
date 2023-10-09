import RNFetchBlob from 'rn-fetch-blob';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { KJUR } from 'jsrsasign';

import { getSupportedVersionsCloud } from '../services/restApi';
import { TCloudInfo, IServerInfo, ISupportedVersions, ISupportedVersionsData, IApiServerInfo } from '../../definitions';
import { selectServerFailure } from '../../actions/server';
import { store } from '../store/auxStore';
import I18n from '../../i18n';
import { SIGNED_SUPPORTED_VERSIONS_PUBLIC_KEY } from '../constants';

interface IServerInfoFailure {
	success: false;
	message: string;
}

interface IServerInfoSuccess extends IServerInfo {
	success: true;
}

export type TServerInfoResult = IServerInfoSuccess | IServerInfoFailure;

// Verifies if JWT is valid and returns the payload
const verifyJWT = (jwt?: string): ISupportedVersionsData | null => {
	try {
		if (!jwt) {
			return null;
		}
		const isValid = KJUR.jws.JWS.verify(jwt, SIGNED_SUPPORTED_VERSIONS_PUBLIC_KEY, ['RS256']);
		if (!isValid) {
			return null;
		}

		const { payloadObj } = KJUR.jws.JWS.parse(jwt);
		return payloadObj as ISupportedVersions;
	} catch {
		return null;
	}
};

export async function getServerInfo(server: string): Promise<TServerInfoResult> {
	try {
		const response = await RNFetchBlob.fetch('GET', `${server}/api/info`, {
			...RocketChatSettings.customHeaders
		});
		try {
			const jsonRes: IApiServerInfo = response.json();
			if (!jsonRes?.success) {
				return {
					success: false,
					message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
				};
			}

			// Makes use of signed JWT to get supported versions
			const supportedVersions = verifyJWT(jsonRes.supportedVersions?.signed);

			// if backend doesn't have supported versions or JWT is invalid, request from cloud
			if (!supportedVersions) {
				const cloudInfo = await getCloudInfo();

				// Makes use of signed JWT to get supported versions
				const supportedVersionsCloud = verifyJWT(cloudInfo?.signed);

				return {
					...jsonRes,
					success: true,
					supportedVersions: supportedVersionsCloud
				};
			}

			return {
				...jsonRes,
				success: true,
				supportedVersions
			};
		} catch (error) {
			// Request is successful, but response isn't a json
		}
	} catch (e: any) {
		if (e?.message) {
			if (e.message === 'Aborted') {
				store.dispatch(selectServerFailure());
				throw e;
			}
			return {
				success: false,
				message: e.message
			};
		}
	}

	return {
		success: false,
		message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
	};
}

export const getCloudInfo = async (): Promise<TCloudInfo | null> => {
	const uniqueId = store.getState().settings.uniqueID as string;
	const response = await getSupportedVersionsCloud(uniqueId);
	return response.json() as unknown as TCloudInfo;
};

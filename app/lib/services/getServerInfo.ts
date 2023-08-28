import RNFetchBlob from 'rn-fetch-blob';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { KJUR } from 'jsrsasign';

import { ICloudInfo, IServerInfo, ISupportedVersions } from '../../definitions';
import { selectServerFailure } from '../../actions/server';
import { store } from '../store/auxStore';
import I18n from '../../i18n';

const MOCKED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArbSdeyXHhgBAX93ndDDxCuMhIh9XYCJUHG+vGNKzl4i16W5Fj5bua5gSxbIdhl0S7BtYJM3trpp7vnf3Cp6+tFoyKREYr8D/sdznSv7nRgZGgcuwZpXwf3bPN69dPPZvKS9exhlQ13nn1kOUYOgRwOrdZ8sFzJTasKeTCEjEZa4UFU4Q5lvJGOQt7hA3TvFmH4RUQC7Cu8GgHfUQD4fDuRqG4KFteTOJABpvXqJJG7DWiX6N5ssh2qRoaoapK7E+bTYWAzQnR9eAFV1ajCjhm2TqmUbAKWCM2X27ArsCJ9SWzDIj7sAm0G3DtbUKnzCDmZQHXlxcXcMDqWb8w+JQFs8b4pf56SmZn1Bro7TxdXBEgRQCTck1hginBTKciuh8gbv71bLyjPxOxnAQaukxhYpZPJAFrsfps0vKp1EPwNTboDLHHeuGSeaBP/c8ipHqPmraFLR78O07EdsCzJpBvggG7GcgSikjWDjK/eIdsUro7BKFmxjrmT72dmr7Ero9cmtd1aO/6PAenwHafCKnaxGcIGLUCNOXhk+uTPoV2LrN4L5LN75NNu6hd5L4++ngjwVsGsX3JP3seFPaZ2C76TD+Rd6OT+8guZFCGjPzXbDAb6ScQUJb11pyyLooPkz7Xdy5fCBRoeIWtjs6UwH4n57SJ/gkzkmUykX0WT3wqhkCAwEAAQ==
-----END PUBLIC KEY-----`;

const MOCKED_SIGNED =
	'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOiIyMDIzLTA5LTEyVDAwOjAwOjAwLjAwMFoiLCJpMThuIjp7ImVuIjp7Im1lc3NhZ2VfdG9rZW4iOiJZb3VyIHNlcnZlciBpcyBhYm91dCB0byBiZSBkZXByZWNhdGVkLiBQbGVhc2UgdXBkYXRlIHRvIHRoZSBsYXRlc3QgdmVyc2lvbi4ifX0sInZlcnNpb25zIjpbeyJ2ZXJzaW9uIjoiNi41LjAiLCJleHBpcmF0aW9uIjoiMjAyMy0wOS0xMVQwMDowMDowMC4wMDBaIn0seyJ2ZXJzaW9uIjoiNi40LjAiLCJleHBpcmF0aW9uIjoiMjAyMy0wOC0yOVQwMDowMDowMC4wMDBaIn1dfQ.GzkUMsZPaVMEfVQxNC64QCUdNdU7h58qLvbjAff7zZ51Payo5WLxswdc5zgcbkrqg6TS3V4HjQM4u1yzO9muM_4GLfOXez67koKd9tLpX4CXtOwIQXyZ3bznPxiET8YWGUCEomzJexi1xtGT7r7iemaQNyJB3FBUl616yts4UiFiF0FjVd-iahwAYhJjmQUzW3PY2pMH1msY9x3O1-0r-w23CSHSZULi0Qv0QyDPANRqWGRJAB4Nh8EuVnbHb_K7qcT3nufBZFqZpf9BSTiFobShBT9H6Is3xq1Kl-6tkdpF0NHGsIGxGvX6DeXUshjbTvWh1CXYQpvnmSAY5Ik20gr0StMine7tciUhTeuBIv8UrMta0bm9RrLUSe2_sJx5dsbL9GlEQ7IDsg08bRRkNFQunnZEAbVkmzfTv0cjx3eCPwBWeTbUcdlQLR-k9qzIzOFCkYTBkWgEtTYEHzP8q51MV-HNWzI-HpGbt6Tuf_AeRh1Pjlf_As34pnR1_Az4X3W6VLsL6yvm-wsDDehIZY32Vk2W4jGDwxf8iwipc04T83QtCKaJWiJf5E-ofHNfgywKispUSQZnQgl4JYiprOCpjH_iT1hNOcL1wXy6wd3T9ohDw3j38KROslDQ4ENQdmnzcr-NWTPq3hl8ECcmkaPR0QypbS77fdSNHOpRVHw';

const MOCKED_SUPPORTED_VERSIONS: ISupportedVersions = {
	timestamp: '2023-07-20T00:00:00.000Z',
	messages: [
		{
			remainingDays: 15,
			message: 'message_token',
			type: 'info'
		}
	],
	i18n: {
		en: {
			message_token: 'Your server is about to be deprecated. Please update to the latest version.'
		}
	},
	versions: [
		{
			version: '6.5.0',
			expiration: '2022-09-11T00:00:00.000Z'
		},
		{
			version: '6.4.0',
			expiration: '2022-08-22T00:00:00.000Z'
		}
	],
	exceptions: {
		domain: 'https://open.rocket.chat',
		uniqueId: '123',
		// messages?: Messages[];
		versions: [
			{
				version: '6.5.0',
				expiration: '2023-09-11T00:00:00.000Z'
			},
			{
				version: '6.4.0',
				expiration: '2023-08-25T00:00:00.000Z'
			}
		]
	}
};

interface IServerInfoFailure {
	success: false;
	message: string;
}

interface IServerInfoSuccess extends IServerInfo {
	success: true;
}

type IServerInfoResult = IServerInfoSuccess | IServerInfoFailure;

// Verifies if JWT is valid and returns the payload
const verifyJWT = (jwt?: string): ISupportedVersions | null => {
	if (!jwt) {
		return null;
	}
	const isValid = KJUR.jws.JWS.verify(jwt, MOCKED_PUBLIC_KEY, ['RS256']);
	if (!isValid) {
		return null;
	}

	const { payloadObj } = KJUR.jws.JWS.parse(jwt);
	return payloadObj as ISupportedVersions;
};

export async function getServerInfo(server: string): Promise<IServerInfoResult> {
	try {
		const response = await RNFetchBlob.fetch('GET', `${server}/api/info`, { ...RocketChatSettings.customHeaders });
		try {
			const jsonRes: IServerInfo = response.json();
			if (!jsonRes?.success) {
				return {
					success: false,
					message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
				};
			}

			// Makes use of signed JWT to get supported versions
			const supportedVersions = verifyJWT(jsonRes.signed); // verifyJWT(MOCKED_SIGNED);
			console.log('🚀 ~ file: getServerInfo.ts:96 ~ getServerInfo ~ supportedVersions:', supportedVersions);

			// if backend doesn't have supported versions or JWT is invalid, request from cloud
			if (!supportedVersions) {
				// TODO: if cloud response is too different from `/api/info`, we'll have to call it on another place
				const cloudInfo = await getCloudInfo();
				return {
					...jsonRes,
					success: true,
					supportedVersions: cloudInfo
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

export const getCloudInfo = (): Promise<ICloudInfo> =>
	Promise.resolve({
		signed: MOCKED_SIGNED,
		...MOCKED_SUPPORTED_VERSIONS
	});

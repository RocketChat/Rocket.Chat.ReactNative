import RNFetchBlob from 'rn-fetch-blob';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { KJUR } from 'jsrsasign';

import { ICloudInfo, IServerApiInfo, IServerInfo, ISupportedVersions } from '../../definitions';
import { selectServerFailure } from '../../actions/server';
import { store } from '../store/auxStore';
import I18n from '../../i18n';

const MOCKED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEVs/o5+uQbTjL3chynL4wXgUg2R9
q9UU8I5mEovUf86QZ7kOBIjJwqnzD1omageEHWwHdBO6B+dFabmdT9POxg==
-----END PUBLIC KEY-----`;

const MOCKED_SUPPORTED_VERSIONS: ISupportedVersions = {
	timestamp: '2023-09-20T00:00:00.000Z',
	messages: [
		{
			remainingDays: 15,
			title: 'title',
			subtitle: 'subtitle',
			description: 'description',
			type: 'info',
			link: 'Docs page'
		}
	],
	i18n: {
		en: {
			title: '{{instance_ws_name}} is running an unsupported version of Rocket.Chat',
			subtitle: 'Mobile and desktop app access to {{instance_domain}} will be cut off in {{remaining_days}} days.',
			description: 'User: {{instance_username}}\nEmail: {{instance_email}}\nExtra params: {{test_a}} {{test_b}}'
		},
		'pt-BR': {
			title: 'alo title',
			subtitle: 'asiudhasodhasoiudhoaidasd'
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
		versions: [
			{
				version: '6.5.0',
				expiration: '2023-09-11T00:00:00.000Z'
			},
			{
				version: '6.4.0',
				expiration: '2023-08-30T00:00:00.000Z'
			},
			{
				version: '6.2.0',
				expiration: '2023-09-30T00:00:00.000Z',
				messages: [
					{
						remainingDays: 30,
						title: 'title',
						subtitle: 'subtitle',
						description: 'description',
						type: 'info',
						link: 'Docs page',
						params: {
							test_a: 'test A works',
							test_b: ':)'
						}
					}
				]
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

export type TServerInfoResult = IServerInfoSuccess | IServerInfoFailure;

// Verifies if JWT is valid and returns the payload
const verifyJWT = (jwt?: string): ISupportedVersions | null => {
	if (!jwt) {
		return null;
	}
	const isValid = KJUR.jws.JWS.verify(jwt, MOCKED_PUBLIC_KEY, ['ES256']);
	if (!isValid) {
		return null;
	}

	const { payloadObj } = KJUR.jws.JWS.parse(jwt);
	return payloadObj as ISupportedVersions;
};

export async function getServerInfo(server: string): Promise<TServerInfoResult> {
	try {
		const response = await RNFetchBlob.fetch('GET', `${server}/api/info`, {
			...RocketChatSettings.customHeaders
		});
		try {
			const jsonRes: IServerApiInfo = response.json();
			if (!jsonRes?.success) {
				return {
					success: false,
					message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
				};
			}

			// Makes use of signed JWT to get supported versions
			const supportedVersions = verifyJWT(jsonRes.supportedVersions);

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

export const getCloudInfo = (): Promise<ICloudInfo> => {
	const uniqueId = store.getState().settings.uniqueID;
	console.log('🚀 ~ file: getServerInfo.ts:139 ~ getCloudInfo ~ uniqueId:', uniqueId);
	return Promise.resolve({
		...MOCKED_SUPPORTED_VERSIONS
	});
};

import RNFetchBlob from 'rn-fetch-blob';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { IServerInfo } from '../../definitions';
import { selectServerFailure } from '../../actions/server';
import { store } from '../store/auxStore';
import I18n from '../../i18n';
import { MIN_ROCKETCHAT_VERSION } from '../constants';
import { compareServerVersion } from '../methods/helpers';

interface IServerInfoFailure {
	success: false;
	message: string;
}

interface IServerInfoSuccess extends IServerInfo {
	success: true;
}

type IServerInfoResult = IServerInfoSuccess | IServerInfoFailure;

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
			if (compareServerVersion(jsonRes.version, 'lowerThan', MIN_ROCKETCHAT_VERSION)) {
				return {
					success: false,
					message: I18n.t('Invalid_server_version', {
						currentVersion: jsonRes.version,
						minVersion: MIN_ROCKETCHAT_VERSION
					})
				};
			}
			return {
				...jsonRes,
				success: true,
				supportedVersions: {
					timestamp: '2023-07-11T00:00:00.000Z',
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
							expiration: '2023-09-11T00:00:00.000Z'
						},
						{
							version: '6.4.0',
							expiration: '2023-08-11T00:00:00.000Z'
						}
					]
				}
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

import { Action } from 'redux';

import { SUPPORTED_VERSIONS } from './actionsTypes';
import { TSVDictionary, TSVMessage, TSVStatus } from '../definitions';

type TSetSupportedVersions = {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
	expiration?: string;
};
type TSetSupportedVersionsAction = Action & TSetSupportedVersions;

export type TActionSupportedVersions = TSetSupportedVersionsAction;

export function setSupportedVersions({ status, message, i18n, expiration }: TSetSupportedVersions): TSetSupportedVersionsAction {
	return {
		type: SUPPORTED_VERSIONS.SET,
		status,
		message,
		i18n,
		expiration
	};
}

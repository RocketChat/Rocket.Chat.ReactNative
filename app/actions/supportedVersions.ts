import { Action } from 'redux';

import { SUPPORTED_VERSIONS } from './actionsTypes';
import { TSVDictionary, TSVMessage, TSVStatus } from '../definitions';

interface ISetSupportedVersionsAction extends Action {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
}

export type TActionSupportedVersions = ISetSupportedVersionsAction;

export function setSupportedVersions({
	status,
	message,
	i18n
}: {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
}): ISetSupportedVersionsAction {
	return {
		type: SUPPORTED_VERSIONS.SET,
		status,
		message,
		i18n
	};
}

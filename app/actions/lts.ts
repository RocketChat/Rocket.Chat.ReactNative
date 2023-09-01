import { Action } from 'redux';

import { LTS } from './actionsTypes';
import { LTSDictionary, LTSMessage, LTSStatus } from '../definitions';

interface ISetLTSAction extends Action {
	status: LTSStatus;
	message?: LTSMessage;
	i18n?: LTSDictionary;
}

export type TActionLTS = ISetLTSAction;

export function setLTS({
	status,
	message,
	i18n
}: {
	status: LTSStatus;
	message?: LTSMessage;
	i18n?: LTSDictionary;
}): ISetLTSAction {
	return {
		type: LTS.SET,
		status,
		message,
		i18n
	};
}

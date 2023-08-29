import { Action } from 'redux';

import { LTS } from './actionsTypes';
import { LTSDictionary, LTSMessage } from '../definitions';

interface ISetLTSAction extends Action {
	success: boolean;
	messages?: LTSMessage[];
	i18n?: LTSDictionary;
}

export type TActionLTS = ISetLTSAction;

export function setLTS({
	success,
	messages,
	i18n
}: {
	success: boolean;
	messages?: LTSMessage[];
	i18n?: LTSDictionary;
}): ISetLTSAction {
	return {
		type: LTS.SET,
		success,
		messages,
		i18n
	};
}

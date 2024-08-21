import { Action } from 'redux';

import { TShareParams } from '../reducers/share';
import { SHARE } from './actionsTypes';

interface IShareSetParams extends Action {
	params: TShareParams;
}

export type TActionsShare = IShareSetParams;

export function shareSetParams(params: TShareParams): IShareSetParams {
	return {
		type: SHARE.SET_PARAMS,
		params
	};
}

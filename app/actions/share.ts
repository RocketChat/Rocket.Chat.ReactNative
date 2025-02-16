import type { Action } from 'redux';

import type { TShareParams } from '../reducers/share';
import { SHARE } from './actionsTypes';

type IShareSetParams = Action & { params: TShareParams; }

export type TActionsShare = IShareSetParams;

export function shareSetParams(params: TShareParams): IShareSetParams {
	return {
		type: SHARE.SET_PARAMS,
		params
	};
}

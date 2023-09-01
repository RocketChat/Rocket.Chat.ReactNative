import { LTSDictionary, LTSMessage, LTSStatus } from '../definitions';
import { LTS } from '../actions/actionsTypes';
import { TActionLTS } from '../actions/lts';

export interface ILTS {
	status: LTSStatus;
	message?: LTSMessage;
	i18n?: LTSDictionary;
}

export const initialState: ILTS = { message: undefined, i18n: undefined, status: 'supported' };

export default (state = initialState, action: TActionLTS): ILTS => {
	switch (action.type) {
		case LTS.SET:
			return {
				...state,
				status: action.status,
				message: action.message,
				i18n: action.i18n
			};
		default:
			return state;
	}
};

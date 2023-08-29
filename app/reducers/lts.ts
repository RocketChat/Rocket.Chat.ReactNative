import { LTSDictionary, LTSMessage } from '../definitions';
import { LTS } from '../actions/actionsTypes';
import { TActionLTS } from '../actions/lts';

export interface ILTS {
	success: boolean;
	messages?: LTSMessage[];
	i18n?: LTSDictionary;
}

export const initialState = { success: false, messages: undefined, i18n: undefined };

export default (state = initialState, action: TActionLTS): ILTS => {
	switch (action.type) {
		case LTS.SET:
			return {
				...state,
				success: action.success,
				messages: action.messages,
				i18n: action.i18n
			};
		default:
			return state;
	}
};

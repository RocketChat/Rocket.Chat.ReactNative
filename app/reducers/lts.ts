import { LTSDictionary, LTSMessage, LTSStatus } from '../definitions';
import { LTS } from '../actions/actionsTypes';
import { TActionLTS } from '../actions/lts';

export interface ILTS {
	success: boolean;
	messages?: LTSMessage[];
	i18n?: LTSDictionary;
	status: LTSStatus;
}

export const initialState: ILTS = { success: false, messages: undefined, i18n: undefined, status: 'valid' };

const getStatus = (success: boolean, messages?: LTSMessage[]): LTSStatus => {
	if (!success) {
		return 'expired';
	}
	if (messages?.length) {
		return 'warn';
	}
	return 'valid';
};

export default (state = initialState, action: TActionLTS): ILTS => {
	switch (action.type) {
		case LTS.SET:
			return {
				...state,
				success: action.success,
				messages: action.messages,
				i18n: action.i18n,
				status: getStatus(action.success, action.messages)
			};
		default:
			return state;
	}
};

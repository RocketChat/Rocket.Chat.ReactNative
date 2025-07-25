import { TActionsShare } from '../actions/share';
import { SHARE } from '../actions/actionsTypes';

export type TShareParams = Record<string, any>;

export interface IShare {
	params: TShareParams;
}

export const initialState: IShare = {
	params: {}
};

export default function share(state = initialState, action: TActionsShare): IShare {
	switch (action.type) {
		case SHARE.SET_PARAMS:
			return {
				...state,
				params: action.params
			};
		default:
			return state;
	}
}

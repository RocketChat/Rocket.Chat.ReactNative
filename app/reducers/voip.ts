import { VOIP } from '../actions/actionsTypes';
import { TActionVoip } from '../actions/voip';
import { VoipSession } from '../lib/voip/definitions';

export interface IVoip {
	session: VoipSession | null;
}

export const initialState: IVoip = { session: null };

export default (state = initialState, action: TActionVoip): IVoip => {
	switch (action.type) {
		case VOIP.UPDATE_SESSION:
			return {
				...state,
				session: action.payload ? { ...state.session, ...action.payload } : null
			};
		default:
			return state;
	}
};

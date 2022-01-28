import { TActionInviteLinks } from '../actions/inviteLinks';
import { INVITE_LINKS } from '../actions/actionsTypes';

export type TInvite = { url: string; expires: string; maxUses: number; uses: number; [x: string]: any };

export interface IInviteLinks {
	token: string;
	days: number;
	maxUses: number;
	invite: TInvite;
}

export const initialState: IInviteLinks = {
	token: '',
	days: 1,
	maxUses: 0,
	invite: { url: '', expires: '', maxUses: 0, uses: 0 }
};

export default (state = initialState, action: TActionInviteLinks): IInviteLinks => {
	switch (action.type) {
		case INVITE_LINKS.SET_TOKEN:
			return { ...state, token: action.token };
		case INVITE_LINKS.SET_PARAMS:
			return {
				...state,
				...action.params
			};
		case INVITE_LINKS.SET_INVITE:
			return {
				...state,
				invite: action.invite
			};
		case INVITE_LINKS.REQUEST:
			return state;
		case INVITE_LINKS.SUCCESS:
			return initialState;
		case INVITE_LINKS.FAILURE:
			return initialState;
		case INVITE_LINKS.CLEAR:
			return initialState;
		default:
			return state;
	}
};

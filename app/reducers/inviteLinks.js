import { INVITE_LINKS } from '../actions/actionsTypes';

const initialState = {
	token: '',
	days: 1,
	maxUses: 0,
	invite: {}
};

export default (state = initialState, action) => {
	switch (action.type) {
		case INVITE_LINKS.SET_TOKEN:
			return {
				token: action.token
			};
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

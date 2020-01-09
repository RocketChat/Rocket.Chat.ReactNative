import { INVITE_LINKS } from '../actions/actionsTypes';

const initialState = {
	token: '',
	days: 1,
	maxUses: 0,
	url: null,
	expires: null
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
				days: action.days,
				maxUses: action.maxUses
			};
		case INVITE_LINKS.SET_INVITE_URL:
			return {
				...state,
				url: action.url,
				expires: action.maxUses
			};
		case INVITE_LINKS.REQUEST:
			return state;
		case INVITE_LINKS.SUCCESS:
			return initialState;
		case INVITE_LINKS.FAILURE:
			return initialState;
		default:
			return state;
	}
};

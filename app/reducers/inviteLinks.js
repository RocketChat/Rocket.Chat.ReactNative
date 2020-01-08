import { INVITE_LINKS } from '../actions/actionsTypes';

const initialState = {
	token: ''
};

export default (state = initialState, action) => {
	switch (action.type) {
		case INVITE_LINKS.SET_TOKEN:
			return {
				token: action.token
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

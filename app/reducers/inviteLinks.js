import { INVITE_LINKS } from '../actions/actionsTypes';

const initialState = {
	token: ''
};

export default (state = initialState, action) => {
	switch (action.type) {
		case INVITE_LINKS.INIT:
			return {
				token: action.token
			};
		case INVITE_LINKS.FINISH:
			return initialState;
		default:
			return state;
	}
};

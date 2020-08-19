import { ENCRYPTION } from '../actions/actionsTypes';

const initialState = {
	banner: null
};

export default function encryption(state = initialState, action) {
	switch (action.type) {
		case ENCRYPTION.SET_BANNER:
			return {
				...state,
				banner: action.banner
			};
		case ENCRYPTION.INIT:
			return initialState;
		default:
			return state;
	}
}

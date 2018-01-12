import * as types from '../constants/types';

const initialState = {
	emojis: {}
};


export default function emojis(state = initialState.emojis, action) {
	if (action.type === types.SET_CUSTOM_EMOJIS) {
		return {
			...state,
			...action.payload
		};
	}

	return state;
}

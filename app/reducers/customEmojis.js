import * as types from '../constants/types';

const initialState = {
	customEmojis: {}
};


export default function customEmojis(state = initialState.customEmojis, action) {
	if (action.type === types.SET_CUSTOM_EMOJIS) {
		return {
			...state,
			...action.payload
		};
	}

	return state;
}

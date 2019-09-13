import { SET_CUSTOM_EMOJIS } from '../actions/actionsTypes';

const initialState = {
	customEmojis: {}
};

export default function customEmojis(state = initialState, action) {
	switch (action.type) {
		case SET_CUSTOM_EMOJIS:
			return action.emojis;
		default:
			return state;
	}
}

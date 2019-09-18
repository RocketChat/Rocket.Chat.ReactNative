import * as types from './actionsTypes';

export function setCustomEmojis(emojis) {
	return {
		type: types.SET_CUSTOM_EMOJIS,
		emojis
	};
}

import * as types from './actionsTypes';

export function setKeyboardOpen() {
	return {
		type: types.KEYBOARD.OPEN
	};
}

export function setKeyboardClosed() {
	return {
		type: types.KEYBOARD.CLOSE
	};
}

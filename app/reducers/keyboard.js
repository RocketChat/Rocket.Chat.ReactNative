import * as types from '../actions/actionsTypes';

const initialState = {
	isOpen: false
};

export default function messages(state = initialState, action) {
	switch (action.type) {
		case types.KEYBOARD.OPEN:
			return {
				...state,
				isOpen: true
			};
		case types.KEYBOARD.CLOSE:
			return {
				...state,
				isOpen: false
			};
		default:
			return state;
	}
}

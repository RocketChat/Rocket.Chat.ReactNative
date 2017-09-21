import { APP } from '../actions/actionsTypes';

const initialState = {
	starting: true
};

export default function app(state = initialState, action) {
	switch (action.type) {
		case APP.INIT:
			return {
				...state,
				starting: true
			};
		case APP.READY:
			return {
				...state,
				starting: false
			};
		default:
			return state;
	}
}

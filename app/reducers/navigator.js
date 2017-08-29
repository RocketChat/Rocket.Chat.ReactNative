import * as types from '../actions/actionsTypes';

const initialState = {};

export default function navigations(state = initialState, action) {
	switch (action.type) {
		case types.NAVIGATION.SET:
			return action.navigator
			;
		default:
			return state;
	}
}

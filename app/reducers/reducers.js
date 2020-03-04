import * as types from '../constants/types';
import initialState from './initialState';

export default function settings(state = initialState.settings, action) {
	if (action.type === types.ADD_SETTINGS) {
		return {
			...state,
			...action.payload
		};
	}
	return state;
}

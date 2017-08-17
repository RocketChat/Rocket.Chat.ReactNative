import RocketChat from '../lib/rocketchat';
import * as types from '../constants/types';
import initialState from './initialState';

export function server(state = initialState.server, action) {
	if (action.type === types.SET_CURRENT_SERVER) {
		RocketChat.currentServer = action.payload;
		return action.payload;
	}

	return state;
}

export function settings(state = initialState.settings, action) {
	if (action.type === types.SET_ALL_SETTINGS) {
		return { ...state,
			...action.payload
		};
	}

	return state;
}

import * as types from '../constants/types';
import { APP } from './actionsTypes';

export function appStart(root, text) {
	return {
		type: APP.START,
		root,
		text
	};
}

export function appReady() {
	return {
		type: APP.READY
	};
}

export function appInit() {
	return {
		type: APP.INIT
	};
}

export function appInitLocalSettings() {
	return {
		type: APP.INIT_LOCAL_SETTINGS
	};
}

export function setCurrentServer(server) {
	return {
		type: types.SET_CURRENT_SERVER,
		payload: server
	};
}

export function addSettings(settings) {
	return {
		type: types.ADD_SETTINGS,
		payload: settings
	};
}

export function login() {
	return {
		type: 'LOGIN'
	};
}

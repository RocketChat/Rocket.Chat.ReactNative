import * as types from '../constants/types';
import { APP } from './actionsTypes';

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
export function setCurrentServer(server) {
	return {
		type: types.SET_CURRENT_SERVER,
		payload: server
	};
}

export function setAllSettings(settings) {
	return {
		type: types.SET_ALL_SETTINGS,
		payload: settings
	};
}
export function login() {
	return {
		type: 'LOGIN'
	};
}

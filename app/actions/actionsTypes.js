const REQUEST = 'REQUEST';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const defaultTypes = [REQUEST, SUCCESS, FAILURE];
function createRequestTypes(base, types = defaultTypes) {
	const res = {};
	types.forEach(type => (res[type] = `${ base }_${ type }`));
	return res;
}

// Login events
export const LOGIN = createRequestTypes('LOGIN', [
	...defaultTypes,
	'SET_TOKEN',
	'RESTORE_TOKEN',
	'SUBMIT',
	'REGISTER_SUBMIT',
	'REGISTER_REQUEST',
	'REGISTER_SUCCESS',
	'REGISTER_INCOMPLETE',
	'SET_USERNAME_SUBMIT',
	'SET_USERNAME_REQUEST',
	'SET_USERNAME_SUCCESS'
]);
export const FORGOT_PASSWORD = createRequestTypes('FORGOT_PASSWORD', [
	...defaultTypes,
	'INIT'
]);
export const ROOMS = createRequestTypes('ROOMS');
export const ROOM = createRequestTypes('ROOM', ['ADD_USER_TYPING', 'REMOVE_USER_TYPING', 'USER_TYPING', 'OPEN', 'IM_TYPING']);
export const APP = createRequestTypes('APP', ['READY', 'INIT']);
export const MESSAGES = createRequestTypes('MESSAGES', [
	...defaultTypes,
	'DELETE_REQUEST',
	'DELETE_SUCCESS',
	'DELETE_FAILURE',
	'EDIT_INIT',
	'EDIT_REQUEST',
	'EDIT_SUCCESS',
	'EDIT_FAILURE',
	'STAR_REQUEST',
	'STAR_SUCCESS',
	'STAR_FAILURE',
	'PERMALINK_REQUEST',
	'PERMALINK_SUCCESS',
	'PERMALINK_FAILURE',
	'TOGGLE_PIN_REQUEST',
	'TOGGLE_PIN_SUCCESS',
	'TOGGLE_PIN_FAILURE',
	'SET_INPUT'
]);
export const CREATE_CHANNEL = createRequestTypes('CREATE_CHANNEL', [
	...defaultTypes,
	'REQUEST_USERS',
	'SUCCESS_USERS',
	'FAILURE_USERS',
	'SET_USERS',
	'ADD_USER',
	'REMOVE_USER',
	'RESET'
]);
export const NAVIGATION = createRequestTypes('NAVIGATION', ['SET']);
export const SERVER = createRequestTypes('SERVER', [
	...defaultTypes,
	'SELECT',
	'CHANGED',
	'ADD',
	'GOTO_ADD'
]);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success

export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';

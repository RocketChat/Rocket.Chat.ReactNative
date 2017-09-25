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
export const LOGIN = createRequestTypes('LOGIN', [...defaultTypes, 'SET_TOKEN', 'SUBMIT']);
export const ROOMS = createRequestTypes('ROOMS');
export const APP = createRequestTypes('APP', ['READY', 'INIT']);
export const MESSAGES = createRequestTypes('MESSAGES');
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
export const SERVER = createRequestTypes('SERVER', [...defaultTypes, 'SELECT', 'CHANGED', 'ADD']);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success

export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';


const REQUEST = 'REQUEST';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const defaultTypes = [REQUEST, SUCCESS, FAILURE];
function createRequestTypes(base, types = defaultTypes) {
	const res = {};
	types.forEach(type => res[type] = `${ base }_${ type }`);
	return res;
}

// Login events
export const LOGIN = createRequestTypes('LOGIN');
export const ROOMS = createRequestTypes('ROOMS');
export const MESSAGES = createRequestTypes('MESSAGES');
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success

export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';

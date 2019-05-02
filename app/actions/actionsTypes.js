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
	'SET_SERVICES',
	'SET_PREFERENCE',
	'SET_SORT_PREFERENCE'
]);
export const USER = createRequestTypes('USER', ['SET']);
export const ROOMS = createRequestTypes('ROOMS', [
	...defaultTypes,
	'SET_SEARCH',
	'CLOSE_SERVER_DROPDOWN',
	'TOGGLE_SERVER_DROPDOWN',
	'CLOSE_SORT_DROPDOWN',
	'TOGGLE_SORT_DROPDOWN',
	'OPEN_SEARCH_HEADER',
	'CLOSE_SEARCH_HEADER'
]);
export const ROOM = createRequestTypes('ROOM', ['LEAVE', 'ERASE', 'USER_TYPING']);
export const APP = createRequestTypes('APP', ['START', 'READY', 'INIT']);
export const MESSAGES = createRequestTypes('MESSAGES', [
	...defaultTypes,
	'ACTIONS_SHOW',
	'ACTIONS_HIDE',
	'ERROR_ACTIONS_SHOW',
	'ERROR_ACTIONS_HIDE',
	'DELETE_REQUEST',
	'DELETE_SUCCESS',
	'DELETE_FAILURE',
	'EDIT_INIT',
	'EDIT_CANCEL',
	'EDIT_REQUEST',
	'EDIT_SUCCESS',
	'EDIT_FAILURE',
	'TOGGLE_STAR_REQUEST',
	'TOGGLE_STAR_SUCCESS',
	'TOGGLE_STAR_FAILURE',
	'TOGGLE_PIN_REQUEST',
	'TOGGLE_PIN_SUCCESS',
	'TOGGLE_PIN_FAILURE',
	'REPLY_INIT',
	'REPLY_CANCEL',
	'TOGGLE_REACTION_PICKER',
	'REPLY_BROADCAST'
]);
export const CREATE_CHANNEL = createRequestTypes('CREATE_CHANNEL', [...defaultTypes]);
export const SELECTED_USERS = createRequestTypes('SELECTED_USERS', ['ADD_USER', 'REMOVE_USER', 'RESET', 'SET_LOADING']);
export const SERVER = createRequestTypes('SERVER', [
	...defaultTypes,
	'SELECT_SUCCESS',
	'SELECT_REQUEST',
	'INIT_ADD',
	'FINISH_ADD'
]);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success
export const SNIPPETED_MESSAGES = createRequestTypes('SNIPPETED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const DEEP_LINKING = createRequestTypes('DEEP_LINKING', ['OPEN']);
export const SORT_PREFERENCES = createRequestTypes('SORT_PREFERENCES', ['SET_ALL', 'SET']);

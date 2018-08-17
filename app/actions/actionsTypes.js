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
	'SET_USERNAME_SUCCESS',
	'OPEN',
	'CLOSE',
	'SET_SERVICES',
	'REMOVE_SERVICES',
	'SET_PREFERENCE'
]);
export const FORGOT_PASSWORD = createRequestTypes('FORGOT_PASSWORD', [
	...defaultTypes,
	'INIT'
]);
export const USER = createRequestTypes('USER', ['SET']);
export const ROOMS = createRequestTypes('ROOMS', [
	...defaultTypes,
	'SET_SEARCH',
	'CLOSE_SERVER_DROPDOWN',
	'TOGGLE_SERVER_DROPDOWN',
	'CLOSE_SORT_DROPDOWN',
	'TOGGLE_SORT_DROPDOWN'
]);
export const ROOM = createRequestTypes('ROOM', [
	'ADD_USER_TYPING',
	'REMOVE_USER_TYPING',
	'SOMEONE_TYPING',
	'OPEN',
	'CLOSE',
	'LEAVE',
	'ERASE',
	'USER_TYPING',
	'MESSAGE_RECEIVED',
	'SET_LAST_OPEN'
]);
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
export const NAVIGATION = createRequestTypes('NAVIGATION', ['SET']);
export const SERVER = createRequestTypes('SERVER', [
	...defaultTypes,
	'SELECT_SUCCESS',
	'SELECT_REQUEST'
]);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT', 'DISCONNECT_BY_USER']);
export const LOGOUT = 'LOGOUT'; // logout is always success
export const ACTIVE_USERS = createRequestTypes('ACTIVE_USERS', ['SET']);
export const ROLES = createRequestTypes('ROLES', ['SET']);
export const STARRED_MESSAGES = createRequestTypes('STARRED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED', 'MESSAGE_UNSTARRED']);
export const PINNED_MESSAGES = createRequestTypes('PINNED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED', 'MESSAGE_UNPINNED']);
export const MENTIONED_MESSAGES = createRequestTypes('MENTIONED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const SNIPPETED_MESSAGES = createRequestTypes('SNIPPETED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const ROOM_FILES = createRequestTypes('ROOM_FILES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const DEEP_LINKING = createRequestTypes('DEEP_LINKING', ['OPEN']);

export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';


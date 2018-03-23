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
	'REMOVE_SERVICES'
]);
export const FORGOT_PASSWORD = createRequestTypes('FORGOT_PASSWORD', [
	...defaultTypes,
	'INIT'
]);
export const USER = createRequestTypes('USER', ['SET']);
export const ROOMS = createRequestTypes('ROOMS', [...defaultTypes, 'SET_SEARCH']);
export const ROOM = createRequestTypes('ROOM', [
	'ADD_USER_TYPING',
	'REMOVE_USER_TYPING',
	'SOMEONE_TYPING',
	'OPEN',
	'CLOSE',
	'LEAVE',
	'USER_TYPING',
	'MESSAGE_RECEIVED',
	'SET_LAST_OPEN',
	'LAYOUT_ANIMATION'
]);
export const APP = createRequestTypes('APP', ['READY', 'INIT']);
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
	'PERMALINK_REQUEST',
	'PERMALINK_SUCCESS',
	'PERMALINK_FAILURE',
	'PERMALINK_CLEAR',
	'TOGGLE_PIN_REQUEST',
	'TOGGLE_PIN_SUCCESS',
	'TOGGLE_PIN_FAILURE',
	'SET_INPUT',
	'CLEAR_INPUT',
	'TOGGLE_REACTION_PICKER'
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
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT', 'DISCONNECT_BY_USER']);
export const LOGOUT = 'LOGOUT'; // logout is always success
export const ACTIVE_USERS = createRequestTypes('ACTIVE_USERS', ['SET', 'REQUEST']);
export const STARRED_MESSAGES = createRequestTypes('STARRED_MESSAGES', ['OPEN', 'CLOSE', 'MESSAGES_RECEIVED', 'MESSAGE_UNSTARRED']);
export const PINNED_MESSAGES = createRequestTypes('PINNED_MESSAGES', ['OPEN', 'CLOSE', 'MESSAGES_RECEIVED', 'MESSAGE_UNPINNED']);
export const MENTIONED_MESSAGES = createRequestTypes('MENTIONED_MESSAGES', ['OPEN', 'CLOSE', 'MESSAGES_RECEIVED']);
export const SNIPPETED_MESSAGES = createRequestTypes('SNIPPETED_MESSAGES', ['OPEN', 'CLOSE', 'MESSAGES_RECEIVED']);
export const ROOM_FILES = createRequestTypes('ROOM_FILES', ['OPEN', 'CLOSE', 'MESSAGES_RECEIVED']);

export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';


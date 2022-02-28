const REQUEST = 'REQUEST';
const SUCCESS = 'SUCCESS';
const FAILURE = 'FAILURE';
const defaultTypes = [REQUEST, SUCCESS, FAILURE];
function createRequestTypes(base = {}, types = defaultTypes): Record<string, string> {
	const res: Record<string, string> = {};
	types.forEach(type => (res[type] = `${base}_${type}`));
	return res;
}

// Login events
export const LOGIN = createRequestTypes('LOGIN', [...defaultTypes, 'SET_SERVICES', 'SET_PREFERENCE', 'SET_LOCAL_AUTHENTICATED']);
export const SHARE = createRequestTypes('SHARE', ['SELECT_SERVER', 'SET_USER', 'SET_SETTINGS', 'SET_SERVER_INFO']);
export const USER = createRequestTypes('USER', ['SET']);
export const ROOMS = createRequestTypes('ROOMS', [
	...defaultTypes,
	'REFRESH',
	'SET_SEARCH',
	'CLOSE_SERVER_DROPDOWN',
	'TOGGLE_SERVER_DROPDOWN',
	'OPEN_SEARCH_HEADER',
	'CLOSE_SEARCH_HEADER'
]);
export const ROOM = createRequestTypes('ROOM', [
	'SUBSCRIBE',
	'UNSUBSCRIBE',
	'LEAVE',
	'DELETE',
	'REMOVED',
	'CLOSE',
	'FORWARD',
	'USER_TYPING'
]);
export const INQUIRY = createRequestTypes('INQUIRY', [
	...defaultTypes,
	'SET_ENABLED',
	'RESET',
	'QUEUE_ADD',
	'QUEUE_UPDATE',
	'QUEUE_REMOVE'
]);
export const APP = createRequestTypes('APP', ['START', 'READY', 'INIT', 'INIT_LOCAL_SETTINGS', 'SET_MASTER_DETAIL']);
export const MESSAGES = createRequestTypes('MESSAGES', ['REPLY_BROADCAST']);
export const CREATE_CHANNEL = createRequestTypes('CREATE_CHANNEL', [...defaultTypes]);
export const CREATE_DISCUSSION = createRequestTypes('CREATE_DISCUSSION', [...defaultTypes]);
export const SELECTED_USERS = createRequestTypes('SELECTED_USERS', ['ADD_USER', 'REMOVE_USER', 'RESET', 'SET_LOADING']);
export const SERVER = createRequestTypes('SERVER', [
	...defaultTypes,
	'SELECT_SUCCESS',
	'SELECT_REQUEST',
	'SELECT_FAILURE',
	'INIT_ADD',
	'FINISH_ADD'
]);
export const METEOR = createRequestTypes('METEOR_CONNECT', [...defaultTypes, 'DISCONNECT']);
export const LOGOUT = 'LOGOUT'; // logout is always success
export const SNIPPETED_MESSAGES = createRequestTypes('SNIPPETED_MESSAGES', ['OPEN', 'READY', 'CLOSE', 'MESSAGES_RECEIVED']);
export const DEEP_LINKING = createRequestTypes('DEEP_LINKING', ['OPEN']);
export const SORT_PREFERENCES = createRequestTypes('SORT_PREFERENCES', ['SET_ALL', 'SET']);
export const SET_CUSTOM_EMOJIS = 'SET_CUSTOM_EMOJIS';
export const ACTIVE_USERS = createRequestTypes('ACTIVE_USERS', ['SET', 'CLEAR']);
export const USERS_TYPING = createRequestTypes('USERS_TYPING', ['ADD', 'REMOVE', 'CLEAR']);
export const INVITE_LINKS = createRequestTypes('INVITE_LINKS', [
	'SET_TOKEN',
	'SET_PARAMS',
	'SET_INVITE',
	'CREATE',
	'CLEAR',
	...defaultTypes
]);
export const SETTINGS = createRequestTypes('SETTINGS', ['CLEAR', 'ADD', 'UPDATE']);
export const APP_STATE = createRequestTypes('APP_STATE', ['FOREGROUND', 'BACKGROUND']);
export const ENTERPRISE_MODULES = createRequestTypes('ENTERPRISE_MODULES', ['CLEAR', 'SET']);
export const ENCRYPTION = createRequestTypes('ENCRYPTION', ['INIT', 'STOP', 'DECODE_KEY', 'SET', 'SET_BANNER']);

export const PERMISSIONS = createRequestTypes('PERMISSIONS', ['SET', 'UPDATE']);
export const ROLES = createRequestTypes('ROLES', ['SET', 'UPDATE', 'REMOVE']);

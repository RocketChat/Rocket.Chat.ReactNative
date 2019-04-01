import * as types from '../actions/actionsTypes';

const initialState = {
	isAuthenticated: false,
	isFetching: false,
	isRegistering: false,
	token: '',
	user: {},
	error: '',
	services: {}
};

export default function login(state = initialState, action) {
	switch (action.type) {
		case types.APP.INIT:
			return initialState;
		case types.LOGIN.REQUEST:
			return {
				...state,
				isFetching: true,
				isAuthenticated: false,
				isRegistering: false,
				failure: false,
				error: ''
			};
		case types.LOGIN.SUCCESS:
			return {
				...state,
				isFetching: false,
				isAuthenticated: true,
				user: {
					...state.user,
					...action.user
				},
				token: action.user.token,
				failure: false,
				error: ''
			};
		case types.LOGIN.FAILURE:
			return {
				...state,
				isFetching: false,
				isAuthenticated: false,
				failure: true,
				error: action.err
			};
		case types.LOGOUT:
			return initialState;
		case types.LOGIN.SET_TOKEN:
			return {
				...state,
				token: action.token,
				user: action.user
			};
		case types.LOGIN.RESTORE_TOKEN:
			return {
				...state,
				token: action.token
			};
		case types.LOGIN.REGISTER_SUBMIT:
			return {
				...state,
				isFetching: true,
				isAuthenticated: false,
				isRegistering: true,
				failure: false,
				error: ''
			};
		case types.LOGIN.REGISTER_SUCCESS:
			return {
				...state,
				isFetching: false,
				isAuthenticated: false,
				failure: false,
				error: ''
			};
		case types.LOGIN.SET_USERNAME_SUBMIT:
			return {
				...state,
				isFetching: true
			};
		case types.LOGIN.SET_USERNAME_SUCCESS:
			return {
				...state,
				isFetching: false,
				isRegistering: false
			};
		case types.LOGIN.REGISTER_INCOMPLETE:
			return {
				...state,
				isRegistering: true
			};
		case types.FORGOT_PASSWORD.INIT:
			return initialState;
		case types.FORGOT_PASSWORD.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				success: false
			};
		case types.FORGOT_PASSWORD.SUCCESS:
			return {
				...state,
				isFetching: false,
				success: true
			};
		case types.FORGOT_PASSWORD.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				error: action.err
			};
		case types.USER.SET:
			return {
				...state,
				user: {
					...state.user,
					...action
				}
			};
		case types.LOGIN.SET_SERVICES:
			return {
				...state,
				services: {
					...state.services,
					...action.data
				}
			};
		case types.LOGIN.REMOVE_SERVICES:
			return {
				...state,
				services: {}
			};
		case types.LOGIN.SET_PREFERENCE:
			return {
				...state,
				user: {
					...state.user,
					settings: {
						...state.user.settings,
						preferences: {
							...state.user.settings.preferences,
							...action.preference
						}
					}
				}
			};
		default:
			return state;
	}
}

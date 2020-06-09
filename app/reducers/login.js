import * as types from '../actions/actionsTypes';

const initialState = {
	isLocalAuthenticated: true,
	isAuthenticated: false,
	isFetching: false,
	user: {},
	error: {},
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
				failure: false,
				error: {}
			};
		case types.LOGIN.SUCCESS:
			return {
				...state,
				isFetching: false,
				isAuthenticated: true,
				user: action.user,
				failure: false,
				error: {}
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
		case types.USER.SET:
			return {
				...state,
				user: {
					...state.user,
					...action.user
				}
			};
		case types.LOGIN.SET_SERVICES:
			return {
				...state,
				services: {
					...action.data
				}
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
		case types.LOGIN.SET_LOCAL_AUTHENTICATED:
			return {
				...state,
				isLocalAuthenticated: action.isLocalAuthenticated
			};
		default:
			return state;
	}
}

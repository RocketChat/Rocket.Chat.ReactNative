import * as types from '../actions/actionsTypes';

const initialState = {
	isAuthenticated: false,
	isFetching: false,
	token: '',
	user: {},
	errorMessage: ''
};

export default function login(state = initialState, action) {
	switch (action.type) {
		case types.LOGIN.REQUEST:
			return { ...state,
				isFetching: true,
				isAuthenticated: false
			};
		case types.LOGIN.SUCCESS:
			return { ...state,
				isFetching: false,
				isAuthenticated: true,
				user: action.user,
				// token: action.token,
				failure: false
				// user: action.user
			};
		case types.LOGIN.FAILURE:
			return { ...state,
				isFetching: false,
				isAuthenticated: false,
				failure: true,
				errorMessage: action.err
			};
		case types.LOGOUT:
			return { ...state,
				isFetching: false,
				isAuthenticated: false
			};
		case types.LOGIN.SET_TOKEN:
			return { ...state,
				token: action.token
			};
		default:
			return state;
	}
}

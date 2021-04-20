import { CREATE_TEAM } from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	result: {},
	error: {}
};

export default function(state = initialState, action) {
	switch (action.type) {
		case CREATE_TEAM.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				error: {}
			};
		case CREATE_TEAM.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false,
				result: action.data
			};
		case CREATE_TEAM.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				error: action.err
			};
		default:
			return state;
	}
}

import { CREATE_DISCUSSION } from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	result: {},
	error: {}
};

export default function(state = initialState, action) {
	switch (action.type) {
		case CREATE_DISCUSSION.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				error: {}
			};
		case CREATE_DISCUSSION.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false,
				result: action.data
			};
		case CREATE_DISCUSSION.FAILURE:
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

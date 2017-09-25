import { CREATE_CHANNEL } from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	users: []
};

export default function messages(state = initialState, action) {
	switch (action.type) {
		case CREATE_CHANNEL.REQUEST:
			return {
				...state,
				error: undefined,
				failure: false,
				isFetching: true
			};
		case CREATE_CHANNEL.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false,
				result: action.data
			};
		case CREATE_CHANNEL.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				error: action.err
			};
		case CREATE_CHANNEL.ADD_USER:
			return {
				...state,
				users: state.users.concat(action.user)
			};
		case CREATE_CHANNEL.REMOVE_USER:
			return {
				...state,
				users: state.users.filter(item => item.name !== action.user.name)
			};
		case CREATE_CHANNEL.RESET:
			return initialState;
		default:
			return state;
	}
}

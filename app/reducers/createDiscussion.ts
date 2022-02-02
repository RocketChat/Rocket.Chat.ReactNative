import { TApplicationActions } from '../definitions';
import { CREATE_DISCUSSION } from '../actions/actionsTypes';

export interface ICreateDiscussion {
	isFetching: boolean;
	failure: boolean;
	result: Record<string, any>;
	error: Record<string, any>;
}

export const initialState: ICreateDiscussion = {
	isFetching: false,
	failure: false,
	result: {},
	error: {}
};

export default function (state = initialState, action: TApplicationActions): ICreateDiscussion {
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

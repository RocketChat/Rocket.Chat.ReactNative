import { TApplicationActions } from '../definitions';
import { CREATE_CHANNEL } from '../actions/actionsTypes';

export interface ICreateChannel {
	isFetching: boolean;
	failure: boolean;
	result: Record<string, string>;
	error: Record<string, string>;
}

export const initialState: ICreateChannel = {
	isFetching: false,
	failure: false,
	result: {},
	error: {}
};

export default function (state = initialState, action: TApplicationActions): ICreateChannel {
	switch (action.type) {
		case CREATE_CHANNEL.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				error: {}
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
		default:
			return state;
	}
}

import { TApplicationActions } from '../definitions';
import { CREATE_CHANNEL } from '../actions/actionsTypes';

interface ICreateChannelResult {
	name: string;
	users: string[];
	teamId?: string;
	type: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	isTeam: boolean;
}

interface ICreateChannelResultOnlyGroup {
	group: boolean;
}

export type TCreateChannelResult = ICreateChannelResult | ICreateChannelResultOnlyGroup;

export interface ICreateChannel {
	isFetching: boolean;
	failure: boolean;
	result: TCreateChannelResult | {};
	error: any;
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

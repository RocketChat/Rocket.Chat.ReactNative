import { Action } from 'redux';

import { METEOR } from '../actions/actionsTypes';

export interface IConnect {
	connecting: boolean;
	connected: boolean;
}

export const initialState: IConnect = {
	connecting: false,
	connected: false
};

export default function connect(state = initialState, action: Action): IConnect {
	switch (action.type) {
		case METEOR.REQUEST:
			return {
				...state,
				connecting: true,
				connected: false
			};
		case METEOR.SUCCESS:
			return {
				...state,
				connecting: false,
				connected: true
			};
		case METEOR.DISCONNECT:
			return initialState;
		default:
			return state;
	}
}

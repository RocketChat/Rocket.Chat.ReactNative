import { METEOR } from '../actions/actionsTypes';

const initialState = {
	connecting: false,
	connected: false,
	errorMessage: '',
	failure: false
};

export default function connect(state = initialState, action) {
	switch (action.type) {
		case METEOR.REQUEST:
			return { ...state,
				connecting: true
			};
		case METEOR.SUCCESS:
			return { ...state,
				connecting: false,
				connected: true,
				failure: false
			};
		case METEOR.FAILURE:
			return { ...state,
				connecting: false,
				connected: false,
				failure: true,
				errorMessage: action.err
			};
		default:
			return state;
	}
}

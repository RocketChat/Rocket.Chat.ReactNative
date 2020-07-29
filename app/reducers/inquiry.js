import { INQUIRY } from '../actions/actionsTypes';

const initialState = {
	queued: [],
	error: {}
};

export default function inquiry(state = initialState, action) {
	switch (action.type) {
		case INQUIRY.SUCCESS:
			return {
				...state,
				queued: action.inquiries
			};
		case INQUIRY.FAILURE:
			return {
				...state,
				error: action.error
			};
		case INQUIRY.TAKE:
			return {
				...state,
				queued: state.queued.filter(({ _id }) => _id !== action.inquiryId)
			};
		default:
			return state;
	}
}

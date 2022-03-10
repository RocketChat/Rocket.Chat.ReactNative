import { IOmnichannelRoom, TApplicationActions } from '../../../definitions';
import { INQUIRY } from '../../../actions/actionsTypes';

export interface IInquiry {
	enabled: boolean;
	queued: IOmnichannelRoom[];
	error: any;
}

export const initialState: IInquiry = {
	enabled: false,
	queued: [],
	error: {}
};

export default function inquiry(state = initialState, action: TApplicationActions): IInquiry {
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
		case INQUIRY.SET_ENABLED:
			return {
				...state,
				enabled: action.enabled
			};
		case INQUIRY.QUEUE_ADD:
			return {
				...state,
				queued: [...state.queued, action.inquiry]
			};
		case INQUIRY.QUEUE_UPDATE:
			return {
				...state,
				queued: state.queued.map(item => {
					if (item._id === action.inquiry._id) {
						return action.inquiry;
					}
					return item;
				})
			};
		case INQUIRY.QUEUE_REMOVE:
			return {
				...state,
				queued: state.queued.filter(({ _id }) => _id !== action.inquiryId)
			};
		case INQUIRY.RESET:
			return initialState;
		default:
			return state;
	}
}

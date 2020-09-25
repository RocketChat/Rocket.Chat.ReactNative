import * as types from '../../../actions/actionsTypes';

export function inquirySetEnabled(enabled) {
	return {
		type: types.INQUIRY.SET_ENABLED,
		enabled
	};
}

export function inquiryReset() {
	return {
		type: types.INQUIRY.RESET
	};
}

export function inquiryQueueAdd(inquiry) {
	return {
		type: types.INQUIRY.QUEUE_ADD,
		inquiry
	};
}

export function inquiryQueueUpdate(inquiry) {
	return {
		type: types.INQUIRY.QUEUE_UPDATE,
		inquiry
	};
}

export function inquiryQueueRemove(inquiryId) {
	return {
		type: types.INQUIRY.QUEUE_REMOVE,
		inquiryId
	};
}

export function inquiryRequest() {
	return {
		type: types.INQUIRY.REQUEST
	};
}

export function inquirySuccess(inquiries) {
	return {
		type: types.INQUIRY.SUCCESS,
		inquiries
	};
}

export function inquiryFailure(error) {
	return {
		type: types.INQUIRY.FAILURE,
		error
	};
}

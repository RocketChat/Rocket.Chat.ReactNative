import * as types from './actionsTypes';

export function inquiryTake(inquiryId) {
	return {
		type: types.INQUIRY.TAKE,
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

export function inquiryFailure(err) {
	return {
		type: types.INQUIRY.FAILURE,
		err
	};
}

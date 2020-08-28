import { createSelector } from 'reselect';

const getInquiryQueue = state => state.inquiry.queued;

export const getInquiryQueueSelector = createSelector(
	[getInquiryQueue],
	queue => queue
);

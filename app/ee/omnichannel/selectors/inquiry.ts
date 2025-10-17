import { createSelector } from 'reselect';

import { type IApplicationState } from '../../../definitions';

const getInquiryQueue = (state: IApplicationState) => state.inquiry.queued;

export const getInquiryQueueSelector = createSelector([getInquiryQueue], queue => queue);

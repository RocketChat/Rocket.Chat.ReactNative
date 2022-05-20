import { Action } from 'redux';

import { CREATE_DISCUSSION } from './actionsTypes';

export interface ICreateDiscussionRequestData {
	prid: string;
	pmid?: string;
	t_name?: string;
	reply?: string;
	users: string[];
	encrypted?: boolean;
}
interface ICreateDiscussionRequest extends Action {
	data: ICreateDiscussionRequestData;
}

interface ICreateDiscussionSuccess extends Action {
	data: any;
}

interface ICreateDiscussionFailure extends Action {
	err: any;
}

export type TActionCreateDiscussion = ICreateDiscussionRequest & ICreateDiscussionSuccess & ICreateDiscussionFailure;

export function createDiscussionRequest(data: any): ICreateDiscussionRequest {
	return {
		type: CREATE_DISCUSSION.REQUEST,
		data
	};
}

export function createDiscussionSuccess(data: any): ICreateDiscussionSuccess {
	return {
		type: CREATE_DISCUSSION.SUCCESS,
		data
	};
}

export function createDiscussionFailure(err: any): ICreateDiscussionFailure {
	return {
		type: CREATE_DISCUSSION.FAILURE,
		err
	};
}

import { Action } from 'redux';

import { CREATE_CHANNEL } from './actionsTypes';

// TODO FIX DATA VALUE

interface ICreateChannelRequest extends Action {
	data: any;
}

interface ICreateChannelSuccess extends Action {
	data: any;
}

interface ICreateChannelFailure extends Action {
	err: any;
	isTeam: boolean;
}

export type TActionCreateApp = ICreateChannelRequest & ICreateChannelSuccess & ICreateChannelFailure;

export function createChannelRequest(data: any): ICreateChannelRequest {
	return {
		type: CREATE_CHANNEL.REQUEST,
		data
	};
}

export function createChannelSuccess(data: any): ICreateChannelSuccess {
	return {
		type: CREATE_CHANNEL.SUCCESS,
		data
	};
}

export function createChannelFailure(err: any, isTeam: boolean): ICreateChannelFailure {
	return {
		type: CREATE_CHANNEL.FAILURE,
		err,
		isTeam
	};
}

import type { Action } from 'redux';

import type { TCreateChannelResult } from '../reducers/createChannel';
import { CREATE_CHANNEL } from './actionsTypes';

type ICreateChannelRequest = Action & {
	data: TCreateChannelResult;
}

type ICreateChannelSuccess = Action & {
	data: TCreateChannelResult;
}

type ICreateChannelFailure = Action & {
	err: any;
	isTeam: boolean;
}

export type TActionCreateChannel = ICreateChannelRequest & ICreateChannelSuccess & ICreateChannelFailure;

export function createChannelRequest(data: TCreateChannelResult): ICreateChannelRequest {
	return {
		type: CREATE_CHANNEL.REQUEST,
		data
	};
}

export function createChannelSuccess(data: TCreateChannelResult): ICreateChannelSuccess {
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

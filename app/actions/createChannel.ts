import { Action } from 'redux';

import { TCreateChannelResult } from '../reducers/createChannel';
import { CREATE_CHANNEL } from './actionsTypes';

interface ICreateChannelRequest extends Action {
	data: TCreateChannelResult;
}

interface ICreateChannelSuccess extends Action {
	data: TCreateChannelResult;
}

interface ICreateChannelFailure extends Action {
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

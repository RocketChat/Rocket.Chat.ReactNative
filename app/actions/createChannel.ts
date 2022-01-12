import { Action } from 'redux';

import { CREATE_CHANNEL } from './actionsTypes';

interface ICreateChannelRequestData {
	name: string;
	users: string[];
	teamId: string;
	type: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	isTeam: boolean;
}

interface ICreateChannelRequestDataGroup {
	group: boolean;
}

type TData = ICreateChannelRequestData | ICreateChannelRequestDataGroup;
interface ICreateChannelRequest extends Action {
	data: TData;
}

interface ICreateChannelSuccess extends Action {
	data: TData;
}

interface ICreateChannelFailure extends Action {
	err: any;
	isTeam: boolean;
}

export type TActionCreateChannel = ICreateChannelRequest & ICreateChannelSuccess & ICreateChannelFailure;

export function createChannelRequest({ ...data }: TData): ICreateChannelRequest {
	return {
		type: CREATE_CHANNEL.REQUEST,
		data
	};
}

export function createChannelSuccess({ ...data }: TData): ICreateChannelSuccess {
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

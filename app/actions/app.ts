import { Action } from 'redux';
import { NetInfoStateType } from '@react-native-community/netinfo';

import { RootEnum } from '../definitions';
import { APP } from './actionsTypes';

interface IAppStart extends Action {
	root: RootEnum;
	text?: string;
}

interface ISetMasterDetail extends Action {
	isMasterDetail: boolean;
}

interface ISetNotificationPresenceCap extends Action {
	show: boolean;
}

interface ISetNetInfoState extends Action {
	netInfoState: NetInfoStateType;
}

export type TActionApp = IAppStart & ISetMasterDetail & ISetNotificationPresenceCap & ISetNetInfoState;

interface Params {
	root: RootEnum;
	[key: string]: any;
}

export function appStart({ root, ...args }: Params): IAppStart {
	return {
		type: APP.START,
		root,
		...args
	};
}

export function appReady(): Action {
	return {
		type: APP.READY
	};
}

export function appInit(): Action {
	return {
		type: APP.INIT
	};
}

export function appInitLocalSettings(): Action {
	return {
		type: APP.INIT_LOCAL_SETTINGS
	};
}

export function setMasterDetail(isMasterDetail: boolean): ISetMasterDetail {
	return {
		type: APP.SET_MASTER_DETAIL,
		isMasterDetail
	};
}

export function setNotificationPresenceCap(show: boolean): ISetNotificationPresenceCap {
	return {
		type: APP.SET_NOTIFICATION_PRESENCE_CAP,
		show
	};
}

export function setNetInfoState(netInfoState: NetInfoStateType): ISetNetInfoState {
	return {
		type: APP.SET_NET_INFO_STATE,
		netInfoState
	};
}

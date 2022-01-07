import { Action } from 'redux';

import { RootEnum } from '../definitions';
import { APP } from './actionsTypes';

export const ROOT_OUTSIDE = 'outside';
export const ROOT_INSIDE = 'inside';
export const ROOT_LOADING = 'loading';
export const ROOT_SET_USERNAME = 'setUsername';

interface IAppStart extends Action {
	root: RootEnum;
	text?: string;
}

interface ISetMasterDetail extends Action {
	isMasterDetail: boolean;
}

export type TActionApp = IAppStart & ISetMasterDetail;

export function appStart({ root, ...args }: { root: RootEnum }): IAppStart {
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

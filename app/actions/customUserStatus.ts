import { type Action } from 'redux';

import { CUSTOM_USER_STATUS } from './actionsTypes';
import { type ICustomUserStatus } from '../definitions';

export type TActionCustomUserStatus = Action & { customUserStatus: ICustomUserStatus[] };

export function setCustomUserStatus(customUserStatus: ICustomUserStatus[]): Action & { customUserStatus: ICustomUserStatus[] } {
	return {
		type: CUSTOM_USER_STATUS.SET,
		customUserStatus
	};
}

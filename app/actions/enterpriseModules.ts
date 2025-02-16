import type { Action } from 'redux';

import type { IEnterpriseModules } from '../reducers/enterpriseModules';
import { ENTERPRISE_MODULES } from './actionsTypes';

type ISetEnterpriseModules = Action & { payload: IEnterpriseModules[]; }

export type TActionEnterpriseModules = ISetEnterpriseModules & Action;

export function setEnterpriseModules(modules: IEnterpriseModules[]): ISetEnterpriseModules {
	return {
		type: ENTERPRISE_MODULES.SET,
		payload: modules
	};
}

export function clearEnterpriseModules(): Action {
	return {
		type: ENTERPRISE_MODULES.CLEAR
	};
}

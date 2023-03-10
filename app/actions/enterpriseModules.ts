import { Action } from 'redux';

import { IEnterpriseModules } from '../reducers/enterpriseModules';
import { ENTERPRISE_MODULES } from './actionsTypes';

interface ISetEnterpriseModules extends Action {
	payload: IEnterpriseModules[];
}

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

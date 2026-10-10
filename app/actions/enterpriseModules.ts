import { type Action } from 'redux';

import { type IEnterpriseModules } from '../reducers/enterpriseModules';
import { ENTERPRISE_MODULES } from './actionsTypes';

interface ISetEnterpriseModules extends Action {
	payload: IEnterpriseModules[];
	hasValidLicense: boolean;
}

export type TActionEnterpriseModules = ISetEnterpriseModules & Action;

export function setEnterpriseModules(modules: IEnterpriseModules[], hasValidLicense = false): ISetEnterpriseModules {
	return {
		type: ENTERPRISE_MODULES.SET,
		payload: modules,
		hasValidLicense
	};
}

export function clearEnterpriseModules(): Action {
	return {
		type: ENTERPRISE_MODULES.CLEAR
	};
}

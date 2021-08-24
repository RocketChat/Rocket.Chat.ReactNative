import { ENTERPRISE_MODULES } from './actionsTypes';

export function setEnterpriseModules(modules) {
	return {
		type: ENTERPRISE_MODULES.SET,
		payload: modules
	};
}

export function clearEnterpriseModules() {
	return {
		type: ENTERPRISE_MODULES.CLEAR
	};
}

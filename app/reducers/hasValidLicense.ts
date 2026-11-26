import { type TActionEnterpriseModules } from '../actions/enterpriseModules';
import { ENTERPRISE_MODULES } from '../actions/actionsTypes';

export const initialState = false;

export default (state = initialState, action: TActionEnterpriseModules): boolean => {
	switch (action.type) {
		case ENTERPRISE_MODULES.SET:
			return action.hasValidLicense;
		case ENTERPRISE_MODULES.CLEAR:
			return initialState;
		default:
			return state;
	}
};

import { TActionEnterpriseModules } from '../actions/enterpriseModules';
import { ENTERPRISE_MODULES } from '../actions/actionsTypes';

export type IEnterpriseModules = string;

export const initialState: IEnterpriseModules[] = [];

export default (state = initialState, action: TActionEnterpriseModules): IEnterpriseModules[] => {
	switch (action.type) {
		case ENTERPRISE_MODULES.SET:
			return action.payload;
		case ENTERPRISE_MODULES.CLEAR:
			return initialState;
		default:
			return state;
	}
};

import { type AnyAction } from 'redux';

import { ROUTING_CONFIG, SERVER } from '../../../actions/actionsTypes';

export interface IRoutingConfig {
	returnQueue: boolean | null;
}

export const initialState: IRoutingConfig = {
	returnQueue: null
};

export default function routingConfig(state = initialState, action: AnyAction): IRoutingConfig {
	switch (action.type) {
		case ROUTING_CONFIG.SUCCESS:
			return { returnQueue: action.returnQueue };
		case SERVER.SELECT_REQUEST:
			return initialState;
		default:
			return state;
	}
}

import { type Action } from 'redux';

import { ROUTING_CONFIG } from '../../../actions/actionsTypes';

interface IRoutingConfigSuccess extends Action {
	returnQueue: boolean;
}

interface IRoutingConfigFailure extends Action {
	error: unknown;
}

export type TActionRoutingConfig = Action & Partial<IRoutingConfigSuccess & IRoutingConfigFailure>;

export function routingConfigRequest(): Action {
	return { type: ROUTING_CONFIG.REQUEST };
}

export function routingConfigSuccess(returnQueue: boolean): IRoutingConfigSuccess {
	return { type: ROUTING_CONFIG.SUCCESS, returnQueue };
}

export function routingConfigFailure(error: unknown): IRoutingConfigFailure {
	return { type: ROUTING_CONFIG.FAILURE, error };
}

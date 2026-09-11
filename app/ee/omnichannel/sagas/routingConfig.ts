import { put, select, takeLeading } from 'redux-saga/effects';

import { ROUTING_CONFIG } from '../../../actions/actionsTypes';
import { getRoutingConfig } from '../../../lib/services/restApi';
import { routingConfigFailure, routingConfigSuccess } from '../actions/routingConfig';

const handleRequest = function* handleRequest(): Generator<any, void, any> {
	const returnQueue = yield select(state => state.routingConfig.returnQueue);
	if (returnQueue !== null) {
		return;
	}

	try {
		const routingConfig = yield getRoutingConfig();
		yield put(routingConfigSuccess(routingConfig.returnQueue));
	} catch (error) {
		yield put(routingConfigFailure(error));
	}
};

export default function* routingConfig() {
	yield takeLeading(ROUTING_CONFIG.REQUEST, handleRequest);
}

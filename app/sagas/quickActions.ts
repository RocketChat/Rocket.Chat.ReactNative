import { takeEvery } from 'redux-saga/effects';
import { type Action } from 'redux';

import * as types from '../actions/actionsTypes';
import { navigateToAddServer } from '../lib/navigation/addServer.ts';
import store from '../lib/store';

interface IQuickActionOpen extends Action {
	params: any;
}

function* handleQuickActionOpen(action: IQuickActionOpen): Generator {
	console.log(action.params.action);
	switch (action.params.action) {
		case 'add-server':
			const state = store.getState();
			const server = state?.server?.server;
			navigateToAddServer(server);
			break;
	}
}

export default function* root(): Generator {
	yield takeEvery(types.DEEP_LINKING.QUICK_ACTION, handleQuickActionOpen);
}

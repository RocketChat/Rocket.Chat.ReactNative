import { select, takeEvery, put, take } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { type Action } from 'redux';

import { QUICK_ACTIONS, APP } from '../actions/actionsTypes';
import { appStart } from '../actions/app';
import { serverInitAdd } from '../actions/server';
import { RootEnum } from '../definitions';

interface IQuickActionOpen extends Action {
	params?: {
		action?: string;
	};
	payload?: {
		action?: string;
	};
}

function* handleQuickActionOpen(action: IQuickActionOpen): Generator {
	// yield take(APP.READY);

	// const state = yield select();
	// if (!state?.quickActions || state.quickActions.handled) {
	// 	return;
	// }
	const quickAction = action.params?.action ?? action.payload?.action;

	if (!quickAction) {
		return;
	}

	switch (quickAction) {
		case 'add-server': {
			const server = yield select(state => state?.server?.server);
			console.log('it reached here==========');
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			yield put(serverInitAdd(server));
			break;
		}
		default:
			Alert.alert('Other Quick Action', `this is ${quickAction} action`);
	}

	yield put({ type: QUICK_ACTIONS.QUICK_ACTION_HANDLED });
}

export default function* root(): Generator {
	yield takeEvery(QUICK_ACTIONS.QUICK_ACTION_HANDLE, handleQuickActionOpen);
}

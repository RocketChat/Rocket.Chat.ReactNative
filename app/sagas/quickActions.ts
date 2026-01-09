import { select, takeEvery, put, take, type Effect } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { type Action } from 'redux';

import { QUICK_ACTIONS, APP, UI } from '../actions/actionsTypes';
import { appStart, appInit } from '../actions/app';
import { serverInitAdd } from '../actions/server';
import { IApplicationState, RootEnum } from '../definitions';
import UserPreferences from '../lib/methods/userPreferences';
import { CURRENT_SERVER } from '../lib/constants/keys';
import Navigation from '../lib/navigation/appNavigation';
import { sendEmail } from '../views/SettingsView';
import { goRoom } from '../lib/methods/helpers/goRoom';

interface IQuickActionOpen extends Action {
	params?: {
		action?: string;
	};
	payload?: {
		action?: string;
	};
}

function* waitForAppReady(): Generator<Effect, void, any> {
	const isReady: boolean = yield select((state: any) => state.app.ready);

	if (!isReady) {
		yield put(appInit());
		yield take(APP.READY);
	}
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
			const server = UserPreferences.getString(CURRENT_SERVER);

			console.log('it reached here==========');
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			yield put(serverInitAdd(server || ''));
			break;
		}
		case 'search':
			yield waitForAppReady();
			const currentRoute = Navigation.getCurrentRoute();

			if (currentRoute?.name !== 'RoomsListView') {
				Navigation.navigate('RoomsListView');
			}
			yield put({ type: UI.TRIGGER_SEARCH });
			break;
		case 'contact':
			sendEmail();
			yield waitForAppReady(); // if user navigates back to app just init it
			break;
		case 'recent':
			yield waitForAppReady();
			// goRoom()
			console.log('room===========');
			console.log(
				yield select((state: IApplicationState) => state.rooms.lastVisitedRid),
				'last visited room ===================='
			);
			Alert.alert('last visited room', yield select((state: IApplicationState) => state.rooms.lastVisitedRid));
			break;
		default:
			Alert.alert('Other Quick Action', `this is ${quickAction} action`);
	}

	yield put({ type: QUICK_ACTIONS.QUICK_ACTION_HANDLED });
}

export default function* root(): Generator {
	yield takeEvery(QUICK_ACTIONS.QUICK_ACTION_HANDLE, handleQuickActionOpen);
}

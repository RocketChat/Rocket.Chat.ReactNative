import { select, takeEvery, put, take, type Effect, call } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { type Action } from 'redux';

import { QUICK_ACTIONS, APP, UI, NAVIGATION } from '../actions/actionsTypes';
import { appStart, appInit } from '../actions/app';
import { serverInitAdd } from '../actions/server';
import { type IApplicationState, RootEnum, type TSubscriptionModel } from '../definitions';
import UserPreferences from '../lib/methods/userPreferences';
import { CURRENT_SERVER } from '../lib/constants/keys';
import Navigation from '../lib/navigation/appNavigation';
import { sendEmail } from '../views/SettingsView';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { getRoom } from '../lib/methods/getRoom';

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

function* waitForRoomInDB(rid: string): Generator {
	try {
		yield call(getRoom, rid);
	} catch {
		yield take(APP.START);
	}

	return yield call(getRoom, rid);
}

function* waitForNavigationReady(): Generator {
	if (Navigation.navigationRef.current) {
		return;
	}

	yield take(NAVIGATION.NAVIGATION_READY);
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
		case 'recent': {
			yield waitForAppReady();

			const rid: string = yield select((state: IApplicationState) => state.rooms.lastVisitedRid);

			if (!rid) return;

			try {
				const room: TSubscriptionModel = yield call(waitForRoomInDB, rid);
				console.log(room, 'room============================');
				yield waitForNavigationReady();
				yield call(goRoom, { item: { rid: room.id }, isMasterDetail: true });
			} catch (e) {
				console.log(e);
				Alert.alert('Error', 'Error finding room in this server, try switching server');
			}

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

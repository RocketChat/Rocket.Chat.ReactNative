import { select, takeEvery, put, take, type Effect, call, race, delay } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { type Action } from 'redux';

import { QUICK_ACTIONS, APP, UI, NAVIGATION } from '../actions/actionsTypes';
import { appStart, appInit } from '../actions/app';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { type IApplicationState, RootEnum, type TServerModel, type TSubscriptionModel } from '../definitions';
import UserPreferences from '../lib/methods/userPreferences';
import { CURRENT_SERVER } from '../lib/constants/keys';
import Navigation from '../lib/navigation/appNavigation';
import { sendEmail } from '../views/SettingsView';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { getRoom } from '../lib/methods/getRoom';
import I18n from '../i18n';
import { getServerById } from '../lib/database/services/Server';

interface IQuickActionOpen extends Action {
	params?: {
		action?: string;
	};
	payload?: {
		action?: string;
	};
}

function* waitForAppReady(): Generator<Effect, void, any> {
	const isReady: boolean = yield select((state: IApplicationState) => state.app.ready);

	if (!isReady) {
		yield put(appInit());
		yield take(APP.READY);
	}
}

function* waitForRoomInDB(rid: string): Generator {
	try {
		const room = (yield call(getRoom, rid)) as TSubscriptionModel;
		return room;
	} catch {
		// Wait for APP.START OR timeout
		const { timeout } = (yield race({
			started: take(APP.START),
			timeout: delay(3000)
		})) as { started?: unknown; timeout?: true };

		if (timeout) {
			throw new Error('Timed out waiting for APP.START');
		}
	}

	return yield call(getRoom, rid);
}

function* waitForNavigationReady(): Generator {
	if (Navigation.navigationRef.current) {
		return;
	}

	yield take(NAVIGATION.NAVIGATION_READY);
}

function* switchServer(targetServer: string): Generator {
	const server = (yield call(getServerById, targetServer)) as TServerModel;
	yield put(selectServerRequest(server._raw.id, server.version, true, true));
}

function* handleQuickActionOpen(action: IQuickActionOpen): Generator {
	const quickActionFromParams = action.params?.action ?? action.payload?.action;

	if (!quickActionFromParams) {
		return;
	}

	const actionWithId = quickActionFromParams.split('/');

	const quickAction = actionWithId[0];

	switch (quickAction) {
		case 'add-server': {
			const server = UserPreferences.getString(CURRENT_SERVER);

			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			yield put(serverInitAdd(server || ''));
			break;
		}
		case 'search': {
			yield waitForAppReady();
			const currentRoute = Navigation.getCurrentRoute();

			if (currentRoute?.name !== 'RoomsListView') {
				Navigation.navigate('RoomsListView');
			}
			yield put({ type: UI.TRIGGER_SEARCH });
			break;
		}
		case 'contact': {
			yield call(sendEmail);
			yield waitForAppReady(); // if user navigates back to app just init it
			break;
		}
		case 'recent': {
			yield waitForAppReady();

			const targetServer = decodeURIComponent(actionWithId[1]);
			const currentServer: string = yield select((state: IApplicationState) => state.server.server);

			const rid = actionWithId[2];

			if (!rid) {
				showRoomNotFoundError();
				break;
			}

			if (currentServer !== targetServer) {
				yield call(switchServer, targetServer);
			}

			try {
				const room = (yield call(waitForRoomInDB, rid)) as TSubscriptionModel;
				yield waitForNavigationReady();
				const isMasterDetail = yield select((state: IApplicationState) => state.app.isMasterDetail);
				yield call(goRoom, { item: { rid: room.rid }, isMasterDetail });
			} catch (e) {
				console.log(e);
				showRoomNotFoundError();
			}

			break;
		}
	}

	yield put({ type: QUICK_ACTIONS.QUICK_ACTION_HANDLED });
}

const showRoomNotFoundError = () => {
	Alert.alert(I18n.t('Room_not_found'), I18n.t('Error_finding_room'));
};

export default function* root(): Generator {
	yield takeEvery(QUICK_ACTIONS.QUICK_ACTION_HANDLE, handleQuickActionOpen);
}

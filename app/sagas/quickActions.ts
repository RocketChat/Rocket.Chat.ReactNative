import { select, takeEvery, put, take, type Effect, call, race, delay } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { type Action } from 'redux';

import { QUICK_ACTIONS, APP, NAVIGATION } from '../actions/actionsTypes';
import { appInit, appStart } from '../actions/app';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { RootEnum, type IApplicationState, type TServerModel, type TSubscriptionModel } from '../definitions';
import Navigation from '../lib/navigation/appNavigation';
import { sendEmail } from '../views/SettingsView';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { getRoom } from '../lib/methods/getRoom';
import I18n from '../i18n';
import { getServerById } from '../lib/database/services/Server';
import UserPreferences from '../lib/methods/userPreferences';
import { TOKEN_KEY } from '../lib/constants/keys';
import events from '../lib/methods/helpers/events';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';

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
	const currentServer: string = yield select((state: IApplicationState) => state.server.server);

	if (currentServer === targetServer) {
		return;
	}

	const userId = UserPreferences.getString(`${TOKEN_KEY}-${targetServer}`);
	const isMasterDetail: boolean = yield select((state: IApplicationState) => state.app.isMasterDetail);

	if (isMasterDetail) {
		yield call(goRoom, { item: {}, isMasterDetail });
	}

	if (!userId) {
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		yield put(serverInitAdd(currentServer));

		yield delay(300);
		events.emit('NewServer', { server: targetServer });
		return;
	}

	yield call(localAuthenticate, targetServer);

	const server = (yield call(getServerById, targetServer)) as TServerModel;
	yield put(selectServerRequest(targetServer, server.version, true, true));
}

function* handleQuickActionOpen(action: IQuickActionOpen): Generator {
	const quickActionFromParams = action.params?.action ?? action.payload?.action;

	if (!quickActionFromParams) {
		return;
	}

	const actionWithId = quickActionFromParams.split('/');

	const quickAction = actionWithId[0];

	switch (quickAction) {
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

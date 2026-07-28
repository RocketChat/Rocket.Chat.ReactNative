import { call, put, select, takeLatest } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { checkAndReopen, getSocketStaleness } from '../lib/services/connect';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';
import { checkPendingNotification } from '../lib/notifications';
import { loadMissedMessages } from '../lib/methods/loadMissedMessages';
import { readMessages } from '../lib/methods/readMessages';
import { roomsRequest } from '../actions/rooms';
import sdk from '../lib/services/sdk';

let isProbingSocket = false;

const ROOMS_REQUEST_THROTTLE_MS = 60 * 1000;

let lastRoomsRequestAt = 0;

const isAuthAndConnected = function* isAuthAndConnected() {
	const login = yield select(state => state.login);
	const meteor = yield select(state => state.meteor);
	return login.isAuthenticated && meteor.connected;
};

// Backgrounding can outlive the socket without emitting a DDP event, so nothing syncs the open
// room. `chat.syncMessages` rides REST, so it heals the room even against a dead socket.
const resyncSubscribedRoom = function* resyncSubscribedRoom() {
	const subscribedRoom = yield select(state => state.room.subscribedRoom);
	if (!subscribedRoom) {
		return;
	}
	try {
		yield call(loadMissedMessages, { rid: subscribedRoom });
		yield call(readMessages, subscribedRoom, new Date());
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return;
	}
	const isReady = yield isAuthAndConnected();
	if (!isReady) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield localAuthenticate(server);

		const ddp = sdk.current?.ddp;
		const staleness = getSocketStaleness(ddp);
		if (staleness === 'stale') {
			ddp.reopenNow().catch(e => log(e));
		} else if (staleness === 'gray') {
			if (!isProbingSocket) {
				isProbingSocket = true;
				ddp
					.probe(2000)
					.then(alive => {
						if (!alive) {
							ddp.reopenNow().catch(e => log(e));
						}
					})
					.catch(e => log(e))
					.finally(() => {
						isProbingSocket = false;
					});
			}
		} else {
			checkAndReopen();
		}

		yield resyncSubscribedRoom();

		// A silently dead socket dropped every `stream-notify-user` update; this delta fetch is
		// the only thing that heals the rooms list. Throttle it so rapid foreground cycles don't
		// hammer the endpoint while still healing after a genuine absence.
		const now = Date.now();
		if (now - lastRoomsRequestAt >= ROOMS_REQUEST_THROTTLE_MS) {
			lastRoomsRequestAt = now;
			yield put(roomsRequest());
		}

		// Check for pending notification when app comes to foreground (Android - notification tap while in background)
		checkPendingNotification().catch(e => {
			log('[state.js] Error checking pending notification:', e);
		});
		return yield setUserPresenceOnline();
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return;
	}
	const isReady = yield isAuthAndConnected();
	if (!isReady) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield saveLastLocalAuthenticationSession(server);
		yield setUserPresenceAway();
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
};

export default root;

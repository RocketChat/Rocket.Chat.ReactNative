import { select, takeLatest } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { reconnectMark } from '../lib/methods/helpers/reconnectTrace';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { checkAndReopen, getSocketStaleness } from '../lib/services/connect';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';
import { checkPendingNotification } from '../lib/notifications';
import sdk from '../lib/services/sdk';

let isProbingSocket = false;

const isAuthAndConnected = function* isAuthAndConnected() {
	const login = yield select(state => state.login);
	const meteor = yield select(state => state.meteor);
	return login.isAuthenticated && meteor.connected;
};

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return;
	}
	// Socket state is deliberately not checked here: a closed socket is the case
	// the reopen ladder below exists for.
	const { isAuthenticated } = yield select(state => state.login);
	if (!isAuthenticated) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield localAuthenticate(server);

		const ddp = sdk.current?.ddp;
		const staleness = getSocketStaleness(ddp);
		reconnectMark('app-foreground', staleness);
		if (staleness === 'stale') {
			reconnectMark('reopen-start', 'stale');
			ddp.reopenNow().catch(e => log(e));
		} else if (staleness === 'gray') {
			if (!isProbingSocket) {
				isProbingSocket = true;
				ddp
					.probe(2000)
					.then(alive => {
						reconnectMark('socket-check-done', String(alive));
						if (!alive) {
							reconnectMark('reopen-start', 'gray-dead');
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

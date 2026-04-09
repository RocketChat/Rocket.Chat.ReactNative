import { Q } from '@nozbe/watermelondb';
import { select, takeLatest } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { checkAndReopen } from '../lib/services/connect';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';
import { checkPendingNotification } from '../lib/notifications';
import database from '../lib/database';
import { getUsersPresence } from '../lib/methods/getUsersPresence';

const isAuthAndConnected = function* isAuthAndConnected() {
	const login = yield select(state => state.login);
	const meteor = yield select(state => state.meteor);
	return login.isAuthenticated && meteor.connected;
};

const getDirectMessageUserIds = async () => {
	try {
		const db = database.active;
		const subscriptionsCollection = db.get('subscriptions');
		// Query for open direct message subscriptions that are not archived
		const subscriptions = await subscriptionsCollection
			.query(Q.where('t', 'd'), Q.where('open', true), Q.where('archived', false))
			.fetch();
		// Extract user IDs from uids field (direct messages store the other user's ID in uids)
		const userIds = subscriptions.map(sub => sub.uids?.[0]).filter(Boolean);
		// Remove duplicates
		return [...new Set(userIds)];
	} catch (e) {
		log('[state.js] Error getting DM user IDs:', e);
		return [];
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
		checkAndReopen();
		// Check for pending notification when app comes to foreground (Android - notification tap while in background)
		checkPendingNotification().catch(e => {
			log('[state.js] Error checking pending notification:', e);
		});
		// Refresh presence for DM users to ensure status is up-to-date after background
		const dmUserIds = yield getDirectMessageUserIds();
		if (dmUserIds.length > 0) {
			yield getUsersPresence(dmUserIds);
		}
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

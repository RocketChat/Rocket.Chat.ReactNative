import { Q } from '@nozbe/watermelondb';
import { call, delay, race, take } from 'typed-redux-saga';

import { LOGIN, LOGOUT, ROOMS, SERVER } from '../actions/actionsTypes';
import database from '../lib/database';
import { messagesStatus } from '../lib/constants/messagesStatus';
import log from '../lib/methods/helpers/log';
import { resendMessage } from '../lib/methods/sendMessage';

export const ROOMS_SYNC_WAIT_MS = 10000;
export const RESEND_INTERVAL_MS = 250;

const getMessagesToResend = () =>
	database.active
		.get('messages')
		.query(Q.where('status', messagesStatus.ERROR), Q.where('retry_on_reconnect', true), Q.sortBy('ts', Q.asc))
		.fetch();

function* resendAll() {
	yield* race({
		roomsSynced: take([ROOMS.SUCCESS, ROOMS.FAILURE]),
		timeout: delay(ROOMS_SYNC_WAIT_MS)
	});
	const messages = yield* call(getMessagesToResend);
	for (const message of messages) {
		try {
			yield* call(resendMessage, message, message.tmid);
		} catch (e) {
			log(e);
		}
		if (message.status === messagesStatus.ERROR && message.retryOnReconnect) {
			return;
		}
		yield* delay(RESEND_INTERVAL_MS);
	}
}

export function* resendFailedMessages() {
	try {
		yield* race({
			resend: call(resendAll),
			stop: take([LOGOUT, SERVER.SELECT_REQUEST, LOGIN.SUCCESS])
		});
	} catch (e) {
		log(e);
	}
}

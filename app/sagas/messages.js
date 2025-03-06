import { select, takeLatest } from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';

import { MESSAGES } from '../actions/actionsTypes';
import database from '../lib/database';
import log from '../lib/methods/helpers/log';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { Services } from '../lib/services';

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const db = database.active;
		const { username } = message.u;
		const subsCollection = db.get('subscriptions');
		const subscriptions = yield subsCollection.query(Q.where('name', username)).fetch();

		const isMasterDetail = yield select(state => state.app.isMasterDetail);

		if (subscriptions.length) {
			goRoom({ item: subscriptions[0], isMasterDetail, popToRoot: true, messageId: message.id });
		} else {
			const result = yield Services.createDirectMessage(username);
			if (result?.success) {
				goRoom({ item: result?.room, isMasterDetail, popToRoot: true, messageId: message.id });
			}
		}
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;

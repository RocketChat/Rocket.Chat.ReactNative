import { takeLatest, select } from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';

import Navigation from '../lib/Navigation';
import { MESSAGES } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import log from '../utils/log';
import { goRoom } from '../utils/goRoom';

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const db = database.active;
		const { username } = message.u;
		const subsCollection = db.collections.get('subscriptions');
		const subscriptions = yield subsCollection.query(Q.where('name', username)).fetch();

		const isMasterDetail = yield select(state => state.app.isMasterDetail);
		if (isMasterDetail) {
			Navigation.navigate('DrawerNavigator');
		} else {
			Navigation.navigate('RoomsListView');
		}

		if (subscriptions.length) {
			goRoom({ item: subscriptions[0], isMasterDetail, message });
		} else {
			const result = yield RocketChat.createDirectMessage(username);
			if (result?.success) {
				goRoom({ item: result?.room, isMasterDetail, message });
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

import { takeLatest } from 'redux-saga/effects';
import { Q } from '@nozbe/watermelondb';

import Navigation from '../lib/Navigation';
import { MESSAGES } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import log from '../utils/log';

const goRoom = function goRoom({
	rid, name, fname, message
}) {
	Navigation.navigate('RoomsListView');
	Navigation.navigate('RoomView', {
		rid, name, fname, t: 'd', message
	});
};

const handleReplyBroadcast = function* handleReplyBroadcast({ message }) {
	try {
		const db = database.active;
		const { username, name } = message.u;
		const subsCollection = db.collections.get('subscriptions');
		const subscriptions = yield subsCollection.query(Q.where('name', username)).fetch();
		if (subscriptions.length) {
			yield goRoom({
				rid: subscriptions[0].rid, name: username, fname: name, message
			});
		} else {
			const room = yield RocketChat.createDirectMessage(username);
			yield goRoom({
				rid: room.rid, name: username, fname: name, message
			});
		}
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(MESSAGES.REPLY_BROADCAST, handleReplyBroadcast);
};
export default root;

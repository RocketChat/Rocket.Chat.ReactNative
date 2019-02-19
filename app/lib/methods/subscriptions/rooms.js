import EJSON from 'ejson';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../../realm';
import { merge, normalizeRoom } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';
import random from '../../../utils/random';
import store from '../../createStore';
import { roomsRequest } from '../../../actions/rooms';
import { appDatabase } from '../../database';
import { createSubscription } from '../../database/helpers/subscriptions';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;

const subscriptionsCollection = appDatabase.collections.get('subscriptions');

export default async function subscribeRooms() {
	let timer = null;
	const loop = () => {
		if (timer) {
			return;
		}
		timer = setTimeout(() => {
			clearTimeout(timer);
			timer = false;
			store.dispatch(roomsRequest());
			loop();
		}, 5000);
	};

	const handleConnected = () => {
		store.dispatch(roomsRequest());
		clearTimeout(timer);
		timer = false;
	};

	const handleDisconnected = () => {
		if (this.sdk.userId) {
			loop();
		}
	};

	const handleStreamMessageReceived = protectedFunction(async(ddpMessage) => {
		if (ddpMessage.msg === 'added') {
			return;
		}
		const [type, data] = ddpMessage.fields.args;
		const [, ev] = ddpMessage.fields.eventName.split('/');
		if (/subscriptions/.test(ev)) {
			if (type === 'removed') {
				// TODO: remove subscription
				// let messages = [];
				// const [subscription] = database.objects('subscriptions').filtered('_id == $0', data._id);

				// if (subscription) {
				// 	messages = database.objects('messages').filtered('rid == $0', subscription.rid);
				// }
				// database.write(() => {
				// 	database.delete(messages);
				// 	database.delete(subscription);
				// });
			} else {
				try {
					const tmp = merge(EJSON.fromJSONValue(data));
					await createSubscription(appDatabase, tmp);
				} catch (error) {
					console.log('subscribeRooms -> Error merging sub', error);
				}
			}
		}
		if (/rooms/.test(ev)) {
			try {
				const subs = await subscriptionsCollection.query(
					Q.where('rid', data._id)
				).fetch();
				if (subs.length > 0) {
					const sub = subs[0];
					const normalizedRoom = normalizeRoom(EJSON.fromJSONValue(data));
					await sub.update((s) => {
						s._raw = sanitizedRaw({
							...s._raw,
							...normalizedRoom
						}, subscriptionsCollection.schema);
						s.roomUpdatedAt = normalizedRoom.room_updated_at;
					});
					// TODO: muted users
				}
			} catch (error) {
				console.log('subscribeRooms -> Error merging rooms', error);
			}
		}
		if (/message/.test(ev)) {
			const [args] = ddpMessage.fields.args;
			const _id = random(17);
			const message = {
				_id,
				rid: args.rid,
				msg: args.msg,
				ts: new Date(),
				_updatedAt: new Date(),
				status: messagesStatus.SENT,
				u: {
					_id,
					username: 'rocket.cat'
				}
			};
			requestAnimationFrame(() => database.write(() => {
				database.create('messages', message, true);
			}));
		}
	});

	const stop = () => {
		if (connectedListener) {
			connectedListener.then(removeListener);
			connectedListener = false;
		}
		if (disconnectedListener) {
			disconnectedListener.then(removeListener);
			disconnectedListener = false;
		}
		if (streamListener) {
			streamListener.then(removeListener);
			streamListener = false;
		}
		clearTimeout(timer);
		timer = false;
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnected);
	disconnectedListener = this.sdk.onStreamData('close', handleDisconnected);
	streamListener = this.sdk.onStreamData('stream-notify-user', handleStreamMessageReceived);

	try {
		await this.sdk.subscribeNotifyUser();
	} catch (e) {
		log('subscribeRooms', e);
	}

	return {
		stop: () => stop()
	};
}

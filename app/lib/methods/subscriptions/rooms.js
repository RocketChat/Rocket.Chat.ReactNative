import database from '../../realm';
import watermelondb from '../../database';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';
import random from '../../../utils/random';
import store from '../../createStore';
import { roomsRequest } from '../../../actions/rooms';
import { notificationReceived } from '../../../actions/notification';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;
let subServer;

const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

export default function subscribeRooms() {
	const handleConnection = () => {
		store.dispatch(roomsRequest());
	};

	const handleStreamMessageReceived = protectedFunction(async(ddpMessage) => {
		const watermelon = watermelondb.database;

		// check if the server from variable is the same as the js sdk client
		if (this.sdk && this.sdk.client && this.sdk.client.host !== subServer) {
			return;
		}
		if (ddpMessage.msg === 'added') {
			return;
		}
		const [type, data] = ddpMessage.fields.args;
		const [, ev] = ddpMessage.fields.eventName.split('/');
		if (/subscriptions/.test(ev)) {
			if (type === 'removed') {
				let messages = [];
				const [subscription] = database.objects('subscriptions').filtered('_id == $0', data._id);

				if (subscription) {
					messages = database.objects('messages').filtered('rid == $0', subscription.rid);
				}
				try {
					// database.write(() => {
					// 	database.delete(messages);
					// 	database.delete(subscription);
					// });
					await watermelon.action(async() => {
						const subCollection = watermelon.collections.get('subscriptions');
						const sub = await subCollection.find(subscription.id);
						await sub.destroyPermanently();
					});
				} catch (e) {
					log(e);
				}
			} else {
				const rooms = database.objects('rooms').filtered('_id == $0', data.rid);
				const tmp = merge(data, rooms[0]);
				try {
					await watermelon.action(async() => {
						const subCollection = watermelon.collections.get('subscriptions');
						const sub = await subCollection.find(tmp.rid);
						await sub.update((s) => {
							assignSub(s, tmp);
						});
					});

					database.write(() => {
						database.create('subscriptions', tmp, true);
						database.delete(rooms);
					});
				} catch (e) {
					log(e);
				}
			}
		}
		if (/rooms/.test(ev)) {
			if (type === 'updated') {
				const [sub] = database.objects('subscriptions').filtered('rid == $0', data._id);
				const tmp = merge(sub, data);
				try {
					database.write(() => {
						database.create('subscriptions', tmp, true);
					});
					await watermelon.action(async() => {
						const subCollection = watermelon.collections.get('subscriptions');
						const subW = await subCollection.find(tmp.rid);
						await subW.update((s) => {
							assignSub(s, tmp);
						});
					});
				} catch (e) {
					log(e);
				}
			} else if (type === 'inserted') {
				try {
					database.write(() => {
						database.create('rooms', data, true);
					});
				} catch (e) {
					log(e);
				}
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
			requestAnimationFrame(() => {
				try {
					database.write(() => {
						database.create('messages', message, true);
					});
				} catch (e) {
					log(e);
				}
			});
		}
		if (/notification/.test(ev)) {
			const [notification] = ddpMessage.fields.args;
			store.dispatch(notificationReceived(notification));
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
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnection);
	disconnectedListener = this.sdk.onStreamData('close', handleConnection);
	streamListener = this.sdk.onStreamData('stream-notify-user', handleStreamMessageReceived);

	try {
		// set the server that started this task
		subServer = this.sdk.client.host;
		this.sdk.subscribeNotifyUser().catch(e => console.log(e));

		return {
			stop: () => stop()
		};
	} catch (e) {
		log(e);
		return Promise.reject();
	}
}

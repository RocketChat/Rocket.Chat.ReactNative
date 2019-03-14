import database from '../../realm';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';
import random from '../../../utils/random';
import store from '../../createStore';
import { roomsRequest } from '../../../actions/rooms';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;

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

	const handleStreamMessageReceived = protectedFunction((ddpMessage) => {
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
					database.write(() => {
						database.delete(messages);
						database.delete(subscription);
					});
				} catch (e) {
					log('handleStreamMessageReceived -> subscriptions removed', e);
				}
			} else {
				const rooms = database.objects('rooms').filtered('_id == $0', data.rid);
				const tpm = merge(data, rooms[0]);
				try {
					database.write(() => {
						database.create('subscriptions', tpm, true);
						database.delete(rooms);
					});
				} catch (e) {
					log('handleStreamMessageReceived -> subscriptions updated', e);
				}
			}
		}
		if (/rooms/.test(ev)) {
			if (type === 'updated') {
				const [sub] = database.objects('subscriptions').filtered('rid == $0', data._id);
				try {
					database.write(() => {
						const tmp = merge(sub, data);
						database.create('subscriptions', tmp, true);
					});
				} catch (e) {
					log('handleStreamMessageReceived -> rooms updated', e);
				}
			} else if (type === 'inserted') {
				try {
					database.write(() => {
						database.create('rooms', data, true);
					});
				} catch (e) {
					log('handleStreamMessageReceived -> rooms inserted', e);
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
					log('handleStreamMessageReceived -> message', e);
				}
			});
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

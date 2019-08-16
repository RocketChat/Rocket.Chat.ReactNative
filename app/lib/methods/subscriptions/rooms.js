import database from '../../realm';
import watermelon from '../../database';
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

export default function subscribeRooms() {
	const handleConnection = () => {
		store.dispatch(roomsRequest());
	};

	const handleStreamMessageReceived = protectedFunction(async(ddpMessage) => {
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
				console.log('SUBSCRIPTIONS REMOVE', data)
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
					try {
						await watermelon.action(async() => {
							const subCollection = watermelon.collections.get('subscriptions');
							const sub = await subCollection.find(subscription._id);
							await sub.destroyPermanently();
						});
					} catch (error) {
						alert(error)
					}
				} catch (e) {
					log('err_stream_msg_received_sub_removed', e);
				}
			} else {
				console.log('SUBSCRIPTIONS UPDATE', data)
				const rooms = database.objects('rooms').filtered('_id == $0', data.rid);
				const tpm = merge(data, rooms[0]);
				try {
					await watermelon.action(async() => {
						const subCollection = watermelon.collections.get('subscriptions');
						const sub = await subCollection.find(tpm._id);
						console.log('TCL: handleStreamMessageReceived -> sub', sub);
						await sub.update(post => {
							post.roomUpdatedAt = new Date();
						});
					});

					database.write(() => {
						database.create('subscriptions', tpm, true);
						database.delete(rooms);
					});
				} catch (e) {
					log('err_stream_msg_received_sub_updated', e);
				}
			}
		}
		// if (/rooms/.test(ev)) {
		// 	console.log('ROOMS UPDATE', data)
		// 	if (type === 'updated') {
		// 		const [sub] = database.objects('subscriptions').filtered('rid == $0', data._id);
		// 		try {
		// 			database.write(() => {
		// 				const tmp = merge(sub, data);
		// 				database.create('subscriptions', tmp, true);
		// 			});
		// 		} catch (e) {
		// 			log('err_stream_msg_received_room_updated', e);
		// 		}
		// 	} else if (type === 'inserted') {
		// 		try {
		// 			database.write(() => {
		// 				database.create('rooms', data, true);
		// 			});
		// 		} catch (e) {
		// 			log('err_stream_msg_received_room_inserted', e);
		// 		}
		// 	}
		// }
		// if (/message/.test(ev)) {
		// 	const [args] = ddpMessage.fields.args;
		// 	const _id = random(17);
		// 	const message = {
		// 		_id,
		// 		rid: args.rid,
		// 		msg: args.msg,
		// 		ts: new Date(),
		// 		_updatedAt: new Date(),
		// 		status: messagesStatus.SENT,
		// 		u: {
		// 			_id,
		// 			username: 'rocket.cat'
		// 		}
		// 	};
		// 	requestAnimationFrame(() => {
		// 		try {
		// 			database.write(() => {
		// 				database.create('messages', message, true);
		// 			});
		// 		} catch (e) {
		// 			log('err_stream_msg_received_message', e);
		// 		}
		// 	});
		// }
		// if (/notification/.test(ev)) {
		// 	const [notification] = ddpMessage.fields.args;
		// 	store.dispatch(notificationReceived(notification));
		// }
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
		log('err_subscribe_rooms', e);
		return Promise.reject();
	}
}

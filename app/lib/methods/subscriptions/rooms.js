import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';

import database from '../../database';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';
import random from '../../../utils/random';
import store from '../../createStore';
import { roomsRequest } from '../../../actions/rooms';
import { notificationReceived } from '../../../actions/notification';
import { handlePayloadUserInteraction } from '../actions';
import buildMessage from '../helpers/buildMessage';
import RocketChat from '../../rocketchat';
import EventEmmiter from '../../../utils/events';
import { removedRoom } from '../../../actions/room';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;
let subServer;
let subQueue = {};
let subTimer = null;
let roomQueue = {};
let roomTimer = null;
const WINDOW_TIME = 500;

const createOrUpdateSubscription = async(subscription, room) => {
	try {
		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		const roomsCollection = db.collections.get('rooms');

		if (!subscription) {
			try {
				const s = await subCollection.find(room._id);
				// We have to create a plain obj so we can manipulate it on `merge`
				// Can we do it in a better way?
				subscription = {
					_id: s._id,
					f: s.f,
					t: s.t,
					ts: s.ts,
					ls: s.ls,
					name: s.name,
					fname: s.fname,
					rid: s.rid,
					open: s.open,
					alert: s.alert,
					unread: s.unread,
					userMentions: s.userMentions,
					roomUpdatedAt: s.roomUpdatedAt,
					ro: s.ro,
					lastOpen: s.lastOpen,
					description: s.description,
					announcement: s.announcement,
					topic: s.topic,
					blocked: s.blocked,
					blocker: s.blocker,
					reactWhenReadOnly: s.reactWhenReadOnly,
					archived: s.archived,
					joinCodeRequired: s.joinCodeRequired,
					muted: s.muted,
					broadcast: s.broadcast,
					prid: s.prid,
					draftMessage: s.draftMessage,
					lastThreadSync: s.lastThreadSync,
					jitsiTimeout: s.jitsiTimeout,
					autoTranslate: s.autoTranslate,
					autoTranslateLanguage: s.autoTranslateLanguage,
					lastMessage: s.lastMessage,
					roles: s.roles,
					usernames: s.usernames,
					uids: s.uids
				};
			} catch (error) {
				try {
					await db.action(async() => {
						await roomsCollection.create(protectedFunction((r) => {
							r._raw = sanitizedRaw({ id: room._id }, roomsCollection.schema);
							Object.assign(r, room);
						}));
					});
				} catch (e) {
					// Do nothing
				}
				return;
			}
		}

		if (!room && subscription) {
			try {
				const r = await roomsCollection.find(subscription.rid);
				// We have to create a plain obj so we can manipulate it on `merge`
				// Can we do it in a better way?
				room = {
					customFields: r.customFields,
					broadcast: r.broadcast,
					encrypted: r.encrypted,
					ro: r.ro
				};
			} catch (error) {
				// Do nothing
			}
		}

		const tmp = merge(subscription, room);
		await db.action(async() => {
			let sub;
			try {
				sub = await subCollection.find(tmp.rid);
			} catch (error) {
				// Do nothing
			}

			const batch = [];
			if (sub) {
				try {
					const update = sub.prepareUpdate((s) => {
						Object.assign(s, tmp);
					});
					batch.push(update);
				} catch (e) {
					console.log(e);
				}
			} else {
				try {
					const create = subCollection.prepareCreate((s) => {
						s._raw = sanitizedRaw({ id: tmp.rid }, subCollection.schema);
						Object.assign(s, tmp);
						if (s.roomUpdatedAt) {
							s.roomUpdatedAt = new Date();
						}
					});
					batch.push(create);
				} catch (e) {
					console.log(e);
				}
			}

			if (tmp.lastMessage) {
				const lastMessage = buildMessage(tmp.lastMessage);
				const messagesCollection = db.collections.get('messages');
				let messageRecord;
				try {
					messageRecord = await messagesCollection.find(lastMessage._id);
				} catch (error) {
					// Do nothing
				}

				if (messageRecord) {
					batch.push(
						messageRecord.prepareUpdate(() => {
							Object.assign(messageRecord, lastMessage);
						})
					);
				} else {
					batch.push(
						messagesCollection.prepareCreate((m) => {
							m._raw = sanitizedRaw({ id: lastMessage._id }, messagesCollection.schema);
							m.subscription.id = lastMessage.rid;
							return Object.assign(m, lastMessage);
						})
					);
				}
			}

			await db.batch(...batch);
		});
	} catch (e) {
		log(e);
	}
};

const debouncedUpdateSub = (subscription) => {
	if (!subTimer) {
		subTimer = setTimeout(() => {
			const subBatch = subQueue;
			subQueue = {};
			subTimer = null;
			Object.keys(subBatch).forEach((key) => {
				InteractionManager.runAfterInteractions(() => {
					createOrUpdateSubscription(subBatch[key]);
				});
			});
		}, WINDOW_TIME);
	}
	subQueue[subscription.rid] = subscription;
};

const debouncedUpdateRoom = (room) => {
	if (!roomTimer) {
		roomTimer = setTimeout(() => {
			const roomBatch = roomQueue;
			roomQueue = {};
			roomTimer = null;
			Object.keys(roomBatch).forEach((key) => {
				InteractionManager.runAfterInteractions(() => {
					createOrUpdateSubscription(null, roomBatch[key]);
				});
			});
		}, WINDOW_TIME);
	}
	roomQueue[room._id] = room;
};

export default function subscribeRooms() {
	const handleConnection = () => {
		store.dispatch(roomsRequest());
	};

	const handleStreamMessageReceived = protectedFunction(async(ddpMessage) => {
		const db = database.active;

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
				try {
					const subCollection = db.collections.get('subscriptions');
					const sub = await subCollection.find(data.rid);
					const messages = await sub.messages.fetch();
					const threads = await sub.threads.fetch();
					const threadMessages = await sub.threadMessages.fetch();
					const messagesToDelete = messages.map(m => m.prepareDestroyPermanently());
					const threadsToDelete = threads.map(m => m.prepareDestroyPermanently());
					const threadMessagesToDelete = threadMessages.map(m => m.prepareDestroyPermanently());
					await db.action(async() => {
						await db.batch(
							sub.prepareDestroyPermanently(),
							...messagesToDelete,
							...threadsToDelete,
							...threadMessagesToDelete
						);
					});

					const roomState = store.getState().room;
					// Delete and remove events come from this stream
					// Here we identify which one was triggered
					if (data.rid === roomState.rid && roomState.isDeleting) {
						store.dispatch(removedRoom());
					} else {
						EventEmmiter.emit('ROOM_REMOVED', { rid: data.rid });
					}
				} catch (e) {
					log(e);
				}
			} else {
				debouncedUpdateSub(data);
			}
		}
		if (/rooms/.test(ev)) {
			if (type === 'updated' || type === 'inserted') {
				debouncedUpdateRoom(data);
			}
		}
		if (/message/.test(ev)) {
			const [args] = ddpMessage.fields.args;
			const _id = random(17);
			const message = {
				_id,
				rid: args.rid,
				msg: args.msg,
				blocks: args.blocks,
				ts: new Date(),
				_updatedAt: new Date(),
				status: messagesStatus.SENT,
				u: {
					_id,
					username: 'rocket.cat'
				}
			};
			try {
				const msgCollection = db.collections.get('messages');
				await db.action(async() => {
					await msgCollection.create(protectedFunction((m) => {
						m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
						m.subscription.id = args.rid;
						Object.assign(m, message);
					}));
				});
			} catch (e) {
				log(e);
			}
		}
		if (/notification/.test(ev)) {
			const [notification] = ddpMessage.fields.args;
			try {
				const { payload: { rid } } = notification;
				const room = await RocketChat.getRoom(rid);
				notification.title = RocketChat.getRoomTitle(room);
				notification.avatar = RocketChat.getRoomAvatar(room);
			} catch (e) {
				// do nothing
			}
			store.dispatch(notificationReceived(notification));
		}
		if (/uiInteraction/.test(ev)) {
			const { type: eventType, ...args } = type;
			handlePayloadUserInteraction(eventType, args);
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
		subQueue = {};
		roomQueue = {};
		if (subTimer) {
			clearTimeout(subTimer);
			subTimer = false;
		}
		if (roomTimer) {
			clearTimeout(roomTimer);
			roomTimer = false;
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

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
import { handlePayloadUserInteraction } from '../actions';
import buildMessage from '../helpers/buildMessage';
import RocketChat from '../../rocketchat';
import EventEmitter from '../../../utils/events';
import { removedRoom } from '../../../actions/room';
import { setUser } from '../../../actions/login';
import { INAPP_NOTIFICATION_EMITTER } from '../../../containers/InAppNotification';
import { Encryption } from '../../encryption';
import { E2E_MESSAGE_TYPE } from '../../encryption/constants';

const removeListener = listener => listener.stop();

let connectedListener;
let disconnectedListener;
let streamListener;
let subServer;
let queue = {};
let subTimer = null;
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
					bannerClosed: s.bannerClosed,
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
					uids: s.uids,
					visitor: s.visitor,
					departmentId: s.departmentId,
					servedBy: s.servedBy,
					livechatData: s.livechatData,
					tags: s.tags,
					encrypted: s.encrypted,
					e2eKeyId: s.e2eKeyId,
					E2EKey: s.E2EKey,
					avatarETag: s.avatarETag
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
					v: r.v,
					ro: r.ro,
					tags: r.tags,
					servedBy: r.servedBy,
					encrypted: r.encrypted,
					e2eKeyId: r.e2eKeyId,
					broadcast: r.broadcast,
					customFields: r.customFields,
					departmentId: r.departmentId,
					livechatData: r.livechatData,
					avatarETag: r.avatarETag
				};
			} catch (error) {
				// Do nothing
			}
		}

		let tmp = merge(subscription, room);
		tmp = await Encryption.decryptSubscription(tmp);
		let sub;
		try {
			sub = await subCollection.find(tmp.rid);
		} catch (error) {
			// Do nothing
		}

		// If we're receiving a E2EKey of a room
		if (sub && !sub.E2EKey && subscription?.E2EKey) {
			// Assing info from database subscription to tmp
			// It should be a plain object
			tmp = Object.assign(tmp, {
				rid: sub.rid,
				encrypted: sub.encrypted,
				lastMessage: sub.lastMessage,
				E2EKey: subscription.E2EKey,
				e2eKeyId: sub.e2eKeyId
			});
			// Decrypt lastMessage using the received E2EKey
			tmp = await Encryption.decryptSubscription(tmp);
			// Decrypt all pending messages of this room in parallel
			Encryption.decryptPendingMessages(tmp.rid);
		}

		const batch = [];
		if (sub) {
			try {
				const update = sub.prepareUpdate((s) => {
					Object.assign(s, tmp);
					if (subscription.announcement) {
						if (subscription.announcement !== sub.announcement) {
							s.bannerClosed = false;
						}
					}
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

		const { rooms } = store.getState().room;
		if (tmp.lastMessage && !rooms.includes(tmp.rid)) {
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

		await db.action(async() => {
			await db.batch(...batch);
		});
	} catch (e) {
		log(e);
	}
};

const getSubQueueId = rid => `SUB-${ rid }`;

const getRoomQueueId = rid => `ROOM-${ rid }`;

const debouncedUpdate = (subscription) => {
	if (!subTimer) {
		subTimer = setTimeout(() => {
			const batch = queue;
			queue = {};
			subTimer = null;
			Object.keys(batch).forEach((key) => {
				InteractionManager.runAfterInteractions(() => {
					if (batch[key]) {
						if (/SUB/.test(key)) {
							const sub = batch[key];
							const roomQueueId = getRoomQueueId(sub.rid);
							const room = batch[roomQueueId];
							delete batch[roomQueueId];
							createOrUpdateSubscription(sub, room);
						} else {
							const room = batch[key];
							const subQueueId = getSubQueueId(room._id);
							const sub = batch[subQueueId];
							delete batch[subQueueId];
							createOrUpdateSubscription(sub, room);
						}
					}
				});
			});
		}, WINDOW_TIME);
	}
	queue[subscription.rid ? getSubQueueId(subscription.rid) : getRoomQueueId(subscription._id)] = subscription;
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
		if (/userData/.test(ev)) {
			const [{ diff }] = ddpMessage.fields.args;
			if (diff?.statusLivechat) {
				store.dispatch(setUser({ statusLivechat: diff.statusLivechat }));
			}
			if (['settings.preferences.showMessageInMainThread'] in diff) {
				store.dispatch(setUser({ showMessageInMainThread: diff['settings.preferences.showMessageInMainThread'] }));
			}
		}
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
						EventEmitter.emit('ROOM_REMOVED', { rid: data.rid });
					}
				} catch (e) {
					log(e);
				}
			} else {
				debouncedUpdate(data);
			}
		}
		if (/rooms/.test(ev)) {
			if (type === 'updated' || type === 'inserted') {
				debouncedUpdate(data);
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
				const { payload: { rid, message, sender } } = notification;
				const room = await RocketChat.getRoom(rid);
				notification.title = RocketChat.getRoomTitle(room);
				notification.avatar = RocketChat.getRoomAvatar(room);

				// If it's from a encrypted room
				if (message.t === E2E_MESSAGE_TYPE) {
					// Decrypt this message content
					const { msg } = await Encryption.decryptMessage({ ...message, rid });
					// If it's a direct the content is the message decrypted
					if (room.t === 'd') {
						notification.text = msg;
					// If it's a private group we should add the sender name
					} else {
						notification.text = `${ RocketChat.getSenderName(sender) }: ${ msg }`;
					}
				}
			} catch (e) {
				log(e);
			}
			EventEmitter.emit(INAPP_NOTIFICATION_EMITTER, notification);
		}
		if (/uiInteraction/.test(ev)) {
			const { type: eventType, ...args } = type;
			handlePayloadUserInteraction(eventType, args);
		}
		if (/e2ekeyRequest/.test(ev)) {
			const [roomId, keyId] = ddpMessage.fields.args;
			try {
				await Encryption.provideRoomKeyToUser(keyId, roomId);
			} catch (e) {
				log(e);
			}
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
		queue = {};
		if (subTimer) {
			clearTimeout(subTimer);
			subTimer = false;
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

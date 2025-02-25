import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import EJSON from 'ejson';
import Model from '@nozbe/watermelondb/Model';

import database from '../../database';
import protectedFunction from '../helpers/protectedFunction';
import log from '../helpers/log';
import { store } from '../../store/auxStore';
import { handlePayloadUserInteraction } from '../actions';
import buildMessage from '../helpers/buildMessage';
import EventEmitter from '../helpers/events';
import { removedRoom } from '../../../actions/room';
import { setUser } from '../../../actions/login';
import { INAPP_NOTIFICATION_EMITTER } from '../../../containers/InAppNotification';
import { Encryption } from '../../encryption';
import updateMessages from '../updateMessages';
import {
	IMessage,
	IServerRoom,
	IRoom,
	ISubscription,
	TMessageModel,
	TRoomModel,
	TThreadMessageModel,
	TThreadModel,
	SubscriptionType
} from '../../../definitions';
import sdk from '../../services/sdk';
import { IDDPMessage } from '../../../definitions/IDDPMessage';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { getMessageById } from '../../database/services/Message';
import { E2E_MESSAGE_TYPE } from '../../constants';
import { getRoom } from '../getRoom';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import { getRoomAvatar, getRoomTitle, getSenderName, random } from '../helpers';
import { handleVideoConfIncomingWebsocketMessages } from '../../../actions/videoConf';

const removeListener = (listener: { stop: () => void }) => listener.stop();

let streamListener: Promise<any> | false;
let subServer: string;
let queue: { [key: string]: ISubscription | IRoom } = {};
let subTimer: ReturnType<typeof setTimeout> | null | false = null;
const WINDOW_TIME = 500;

export let roomsSubscription: { stop: () => void } | null = null;

const createOrUpdateSubscription = async (subscription: ISubscription, room: IServerRoom | IRoom) => {
	try {
		const db = database.active;
		const subCollection = db.get('subscriptions');
		const roomsCollection = db.get('rooms');

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
					unmuted: s.unmuted,
					ignored: s.ignored,
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
					E2ESuggestedKey: s.E2ESuggestedKey,
					avatarETag: s.avatarETag,
					onHold: s.onHold,
					hideMentionStatus: s.hideMentionStatus
				} as ISubscription;
			} catch (error) {
				try {
					await db.write(async () => {
						await roomsCollection.create(
							protectedFunction((r: TRoomModel) => {
								r._raw = sanitizedRaw({ id: room._id }, roomsCollection.schema);
								Object.assign(r, room);
							})
						);
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
				} as IRoom;
			} catch (error) {
				// Do nothing
			}
		}

		let tmp = merge(subscription, room);
		tmp = (await Encryption.decryptSubscription(tmp)) as ISubscription;
		const sub = await getSubscriptionByRoomId(tmp.rid);

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
			tmp = (await Encryption.decryptSubscription(tmp)) as ISubscription;
			// Decrypt all pending messages of this room in parallel
			Encryption.decryptPendingMessages(tmp.rid);
		} else if (sub && subscription.E2ESuggestedKey) {
			await Encryption.evaluateSuggestedKey(sub.rid, subscription.E2ESuggestedKey);
		}

		const batch: Model[] = [];
		if (sub) {
			try {
				const update = sub.prepareUpdate(s => {
					Object.assign(s, tmp);
					if (subscription.announcement) {
						if (subscription.announcement !== sub.announcement) {
							s.bannerClosed = false;
						}
					}
					if (sub.hideUnreadStatus && subscription.hasOwnProperty('hideUnreadStatus')) {
						if (sub.hideUnreadStatus !== subscription.hideUnreadStatus) {
							s.hideUnreadStatus = !!subscription.hideUnreadStatus;
						}
					}
				});
				batch.push(update);
			} catch (e) {
				console.log(e);
			}
		} else {
			try {
				const create = subCollection.prepareCreate(s => {
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

		const { subscribedRoom } = store.getState().room;
		if (tmp.lastMessage && subscribedRoom !== tmp.rid) {
			const lastMessage = buildMessage(tmp.lastMessage);
			const messagesCollection = db.get('messages');
			let messageRecord = {} as TMessageModel | null;
			if (lastMessage) {
				messageRecord = await getMessageById(lastMessage._id);
			}

			if (messageRecord) {
				batch.push(
					messageRecord.prepareUpdate(() => {
						Object.assign(messageRecord, lastMessage);
					})
				);
			} else {
				batch.push(
					messagesCollection.prepareCreate(m => {
						if (lastMessage) {
							m._raw = sanitizedRaw({ id: lastMessage._id }, messagesCollection.schema);
							if (m.subscription) {
								m.subscription.id = lastMessage.rid;
							}
						}
						return Object.assign(m, lastMessage);
					})
				);
			}
		}

		await db.write(async () => {
			await db.batch(batch);
		});
	} catch (e) {
		log(e);
	}
};

const getSubQueueId = (rid: string) => `SUB-${rid}`;

const getRoomQueueId = (rid: string) => `ROOM-${rid}`;

const debouncedUpdate = (subscription: ISubscription) => {
	if (!subTimer) {
		subTimer = setTimeout(() => {
			const batch = queue;
			queue = {};
			subTimer = null;
			Object.keys(batch).forEach(key => {
				InteractionManager.runAfterInteractions(() => {
					if (batch[key]) {
						if (/SUB/.test(key)) {
							const sub = batch[key] as ISubscription;
							// When calling the api subscriptions.read passing readThreads as true it does not return this prop
							if (!sub.tunread) sub.tunread = [];
							const roomQueueId = getRoomQueueId(sub.rid);
							const room = batch[roomQueueId] as IRoom;
							delete batch[roomQueueId];
							createOrUpdateSubscription(sub, room);
						} else {
							const room = batch[key] as IRoom;
							// If the omnichannel's chat is onHold and waitingResponse we shouldn't create or update the chat,
							// because it should go to Queue
							if (room.t === SubscriptionType.OMNICHANNEL && room.onHold && room.waitingResponse) {
								return null;
							}
							const subQueueId = getSubQueueId(room._id);
							const sub = batch[subQueueId] as ISubscription;
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

const handleUserData = ({ diff, unset }: { diff: any; unset: any }) => {
	if (diff?.emails?.length > 0) {
		store.dispatch(setUser({ emails: diff.emails }));
	}
	if (diff?.statusLivechat) {
		store.dispatch(setUser({ statusLivechat: diff.statusLivechat }));
	}
	if (diff?.['settings.preferences.showMessageInMainThread'] !== undefined) {
		store.dispatch(setUser({ showMessageInMainThread: diff['settings.preferences.showMessageInMainThread'] }));
	}
	if (diff?.['settings.preferences.alsoSendThreadToChannel'] !== undefined) {
		store.dispatch(setUser({ alsoSendThreadToChannel: diff['settings.preferences.alsoSendThreadToChannel'] }));
	}
	if (diff?.avatarETag) {
		store.dispatch(setUser({ avatarETag: diff.avatarETag }));
	}
	if (unset?.avatarETag) {
		store.dispatch(setUser({ avatarETag: '' }));
	}
	if (diff?.bio) {
		store.dispatch(setUser({ bio: diff.bio }));
	}
	if (diff?.nickname) {
		store.dispatch(setUser({ nickname: diff.nickname }));
	}
};

export default function subscribeRooms() {
	const handleStreamMessageReceived = protectedFunction(async (ddpMessage: IDDPMessage) => {
		const db = database.active;

		// check if the server from variable is the same as the js sdk client
		if (sdk && sdk.current.client && sdk.current.client.host !== subServer) {
			return;
		}
		if (ddpMessage.msg === 'added') {
			return;
		}
		const [type, data] = ddpMessage.fields.args;
		const [, ev] = ddpMessage.fields.eventName.split('/');
		if (/userData/.test(ev)) {
			const [{ diff, unset }] = ddpMessage.fields.args;
			handleUserData({ diff, unset });
		}
		if (/subscriptions/.test(ev)) {
			if (type === 'removed') {
				try {
					const subCollection = db.get('subscriptions');
					const sub = await subCollection.find(data.rid);
					// TODO - today the Relation type from watermelon just support one to one relations
					// @ts-ignore
					const messages = (await sub.messages.fetch()) as TMessageModel[];
					// @ts-ignore
					const threads = (await sub.threads.fetch()) as TThreadModel[];
					// @ts-ignore
					const threadMessages = (await sub.threadMessages.fetch()) as TThreadMessageModel[];

					const messagesToDelete = messages?.map((m: TMessageModel) => m.prepareDestroyPermanently());
					const threadsToDelete = threads?.map((m: TThreadModel) => m.prepareDestroyPermanently());
					const threadMessagesToDelete = threadMessages?.map((m: TThreadMessageModel) => m.prepareDestroyPermanently());

					await db.write(async () => {
						await db.batch(sub.prepareDestroyPermanently(), ...messagesToDelete, ...threadsToDelete, ...threadMessagesToDelete);
					});

					Encryption.stopRoom(data.rid);

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
			try {
				const [args] = ddpMessage.fields.args;
				const _id = random(17);
				const message = {
					// @ts-ignore
					u: {
						_id,
						username: 'rocket.cat',
						name: 'Rocket Cat'
					},
					...buildMessage(EJSON.fromJSONValue(args))
				} as IMessage;
				await updateMessages({ rid: args.rid, update: [message] });
			} catch (e) {
				log(e);
			}
		}
		if (/notification/.test(ev)) {
			const [notification] = ddpMessage.fields.args;
			try {
				const {
					payload: { rid, message, sender }
				} = notification;
				const room = await getRoom(rid);
				notification.title = getRoomTitle(room);
				notification.avatar = getRoomAvatar(room);

				// If it's from a encrypted room
				if (message?.t === E2E_MESSAGE_TYPE) {
					if (message.msg) {
						// Decrypt this message content
						const { msg } = await Encryption.decryptMessage({ ...message, rid });
						// If it's a direct the content is the message decrypted
						if (room.t === 'd') {
							notification.text = msg;
							// If it's a private group we should add the sender name
						} else {
							notification.text = `${getSenderName(sender)}: ${msg}`;
						}
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
		if (/video-conference/.test(ev)) {
			const [action, params] = ddpMessage.fields.args;
			store.dispatch(handleVideoConfIncomingWebsocketMessages({ action, params }));
		}
	});

	const stop = () => {
		if (streamListener) {
			streamListener.then(removeListener);
			streamListener = false;
		}
		queue = {};
		if (subTimer) {
			clearTimeout(subTimer);
			subTimer = false;
		}
		roomsSubscription = null;
	};

	streamListener = sdk.onStreamData('stream-notify-user', handleStreamMessageReceived);

	try {
		// set the server that started this task
		subServer = sdk.current.client.host;
		sdk.current.subscribeNotifyUser().catch((e: unknown) => console.log(e));
		roomsSubscription = { stop: () => stop() };
		return null;
	} catch (e) {
		log(e);
		return Promise.reject();
	}
}

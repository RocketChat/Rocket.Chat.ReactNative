import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import log from '../helpers/log';
import protectedFunction from '../helpers/protectedFunction';
import buildMessage from '../helpers/buildMessage';
import { getOptimisticUpdate, isRecentOptimisticUpdate, clearOptimisticUpdate } from '../helpers/optimisticUpdates';
import database from '../../database';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import { getThreadMessageById } from '../../database/services/ThreadMessage';
import { store as reduxStore } from '../../store/auxStore';
import { addUserTyping, clearUserTyping, removeUserTyping } from '../../../actions/usersTyping';
import { debounce } from '../helpers';
import { subscribeRoom, unsubscribeRoom } from '../../../actions/room';
import { Encryption } from '../../encryption';
import {
	type IMessage,
	type TMessageModel,
	type TSubscriptionModel,
	type TThreadMessageModel,
	type TThreadModel,
	type IDeleteMessageBulkParams
} from '../../../definitions';
import { type IDDPMessage } from '../../../definitions/IDDPMessage';
import sdk from '../../services/sdk';
import { readMessages } from '../readMessages';
import { loadMissedMessages } from '../loadMissedMessages';
import { updateLastOpen } from '../updateLastOpen';
import markMessagesRead from '../helpers/markMessagesRead';

export default class RoomSubscription {
	private rid: string;
	private isAlive: boolean;
	private promises?: Promise<TSubscriptionModel[]>;
	private connectedListener?: Promise<any>;
	private disconnectedListener?: Promise<any>;
	private notifyRoomListener?: Promise<any>;
	private messageReceivedListener?: Promise<any>;

	constructor(rid: string) {
		this.rid = rid;
		this.isAlive = true;
	}

	subscribe = async () => {
		if (this.promises) {
			await this.unsubscribe();
		}
		this.promises = sdk.subscribeRoom(this.rid);

		this.connectedListener = sdk.onStreamData('connected', this.handleConnection);
		this.disconnectedListener = sdk.onStreamData('close', this.handleConnection);
		this.notifyRoomListener = sdk.onStreamData('stream-notify-room', this.handleNotifyRoomReceived);
		this.messageReceivedListener = sdk.onStreamData('stream-room-messages', this.handleMessageReceived);
		if (!this.isAlive) {
			await this.unsubscribe();
		}

		reduxStore.dispatch(subscribeRoom(this.rid));
	};

	unsubscribe = async () => {
		updateLastOpen(this.rid);
		this.isAlive = false;
		reduxStore.dispatch(unsubscribeRoom(this.rid));
		if (this.promises) {
			try {
				const subscriptions = (await this.promises) || [];
				subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
			} catch (e) {
				// do nothing
			}
		}
		reduxStore.dispatch(clearUserTyping());
		this.removeListener(this.connectedListener);
		this.removeListener(this.disconnectedListener);
		this.removeListener(this.notifyRoomListener);
		this.removeListener(this.messageReceivedListener);
	};

	removeListener = async (promise?: Promise<any>): Promise<void> => {
		if (promise) {
			try {
				const listener = await promise;
				listener.stop();
			} catch (e) {
				// do nothing
			}
		}
	};

	handleConnection = async () => {
		try {
			reduxStore.dispatch(clearUserTyping());
			await loadMissedMessages({ rid: this.rid });
			this.read();
		} catch (e) {
			log(e);
		}
	};

	handleNotifyRoomReceived = protectedFunction(async (ddpMessage: IDDPMessage) => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (this.rid !== _rid) {
			return;
		}
		if (ev === 'typing') {
			const { user } = reduxStore.getState().login;
			const { UI_Use_Real_Name } = reduxStore.getState().settings;
			const { subscribedRoom } = reduxStore.getState().room;
			if (subscribedRoom !== _rid) {
				return;
			}
			const [name, typing] = ddpMessage.fields.args;
			const key = UI_Use_Real_Name ? 'name' : 'username';
			if (name !== user[key]) {
				if (typing) {
					reduxStore.dispatch(addUserTyping(name));
				} else {
					reduxStore.dispatch(removeUserTyping(name));
				}
			}
		} else if (ev === 'user-activity') {
			const { user } = reduxStore.getState().login;
			const { UI_Use_Real_Name } = reduxStore.getState().settings;
			const { subscribedRoom } = reduxStore.getState().room;
			if (subscribedRoom !== _rid) {
				return;
			}
			const [name, activities] = ddpMessage.fields.args;
			const key = UI_Use_Real_Name ? 'name' : 'username';
			if (name !== user[key]) {
				if (!!activities && activities.includes('user-typing')) {
					reduxStore.dispatch(addUserTyping(name));
				}
				if (!activities?.length) {
					reduxStore.dispatch(removeUserTyping(name));
				}
			}
		} else if (ev === 'deleteMessage') {
			InteractionManager.runAfterInteractions(async () => {
				if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
					try {
						const { _id } = ddpMessage.fields.args[0];
						const db = database.active;
						const msgCollection = db.get('messages');
						const threadsCollection = db.get('threads');
						const threadMessagesCollection = db.get('thread_messages');
						let deleteMessage: TMessageModel;
						let deleteThread: TThreadModel;
						let deleteThreadMessage: TThreadMessageModel;

						// Delete message
						try {
							const m = await msgCollection.find(_id);
							deleteMessage = m.prepareDestroyPermanently();
						} catch (e) {
							// Do nothing
						}

						// Delete thread
						try {
							const m = await threadsCollection.find(_id);
							deleteThread = m.prepareDestroyPermanently();
						} catch (e) {
							// Do nothing
						}

						// Delete thread message
						try {
							const m = await threadMessagesCollection.find(_id);
							deleteThreadMessage = m.prepareDestroyPermanently();
						} catch (e) {
							// Do nothing
						}
						await db.write(async () => {
							await db.batch(deleteMessage, deleteThread, deleteThreadMessage);
						});
					} catch (e) {
						log(e);
					}
				}
			});
		} else if (ev === 'deleteMessageBulk') {
			InteractionManager.runAfterInteractions(async () => {
				try {
					const { rid, excludePinned, ignoreDiscussion, ts, users, ids } = ddpMessage.fields.args[0] as IDeleteMessageBulkParams;
					const { $gt, $lt, $gte, $lte } = ts || {};
					const db = database.active;

					const query: Q.Clause[] = [Q.where('rid', rid)];

					if ($gt?.$date && $lt?.$date) {
						query.push(Q.where('ts', Q.gt($gt.$date)), Q.where('ts', Q.lt($lt.$date)));
					}

					// only present when inclusive is true in api
					if ($gte?.$date && $lte?.$date) {
						query.push(Q.where('ts', Q.gte($gte.$date)), Q.where('ts', Q.lte($lte.$date)));
					}

					users.forEach((user: string) => {
						query.push(Q.where('u', Q.like(`%\"username\":\"${user}\",%`)));
					});

					if (excludePinned) {
						query.push(Q.or(Q.where('pinned', false), Q.where('pinned', null)));
					}

					if (ignoreDiscussion) {
						query.push(Q.where('drid', null));
					}

					// ids are present when we set limit in api
					if (ids) {
						query.push(Q.where('id', Q.oneOf(ids)));
					}

					const messages = await db
						.get('messages')
						.query(...query)
						.fetch();

					await db.write(async () => {
						await db.batch(...messages.map(message => message.prepareDestroyPermanently()));
					});
				} catch (e) {
					log(e);
				}
			});
		} else if (ev === 'messagesRead') {
			const lastOpen = ddpMessage.fields.args[0]?.until?.$date;
			await markMessagesRead({ rid: this.rid, lastOpen });
		}
	});

	read = debounce(() => {
		readMessages(this.rid, new Date());
	}, 300);

	updateMessage = (message: IMessage): Promise<void> =>
		new Promise(async resolve => {
			if (this.rid !== message.rid) {
				return resolve();
			}

			const batch: TMessageModel[] | TThreadModel[] | TThreadMessageModel[] = [];
			const db = database.active;
			const msgCollection = db.get('messages');
			const threadsCollection = db.get('threads');
			const threadMessagesCollection = db.get('thread_messages');

			// Decrypt the message if necessary
			message = (await Encryption.decryptMessage(message)) as IMessage;

			// Create or update message
			try {
				const messageRecord = await getMessageById(message._id);
				if (messageRecord) {
					if (messageRecord.t === 'e2e' && message.attachments) {
						message.attachments = message.attachments?.map(att => {
							const existing = messageRecord.attachments?.find(
								a =>
									(a.image_url && a.image_url === att.image_url) ||
									(a.video_url && a.video_url === att.video_url) ||
									(a.audio_url && a.audio_url === att.audio_url) ||
									(a.thumb_url && a.thumb_url === att.thumb_url)
							);

							return {
								...att,
								e2e: existing?.e2e,
								title_link: existing?.e2e === 'done' ? existing?.title_link : att.title_link
							};
						});
					}
					batch.push(
						messageRecord.prepareUpdate(
							protectedFunction((m: TMessageModel) => {
								const optimisticUpdate = getOptimisticUpdate(message._id);
								const isRecentOptimistic = isRecentOptimisticUpdate(message._id, 2000);

								if (message.pinned !== undefined) {
									if (isRecentOptimistic && optimisticUpdate?.pinned !== undefined) {
										m.pinned = optimisticUpdate.pinned;
									} else {
										m.pinned = message.pinned;
									}
								}
								if (message.starred !== undefined) {
									if (isRecentOptimistic && optimisticUpdate?.starred !== undefined) {
										m.starred = optimisticUpdate.starred;
									} else {
										m.starred = message.starred;
									}
								}

								const { pinned: _pinned, starred: _starred, ...restMessage } = message;
								Object.assign(m, restMessage);

								if (message.pinned !== undefined) {
									if (isRecentOptimistic && optimisticUpdate?.pinned !== undefined) {
										m.pinned = optimisticUpdate.pinned;
									} else {
										m.pinned = message.pinned;
									}
								}
								if (message.starred !== undefined) {
									if (isRecentOptimistic && optimisticUpdate?.starred !== undefined) {
										m.starred = optimisticUpdate.starred;
									} else {
										m.starred = message.starred;
									}
								}

								if (isRecentOptimistic) {
									clearOptimisticUpdate(message._id);
								}
							})
						)
					);
				} else {
					batch.push(
						msgCollection.prepareCreate(
							protectedFunction((m: TMessageModel) => {
								m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
								if (m.subscription) m.subscription.id = this.rid;
								Object.assign(m, message);
							})
						)
					);
				}
			} catch (e) {
				log(e);
			}

			// Create or update thread
			if (message.tlm) {
				try {
					const threadRecord = await getThreadById(message._id);
					if (threadRecord) {
						batch.push(
							threadRecord.prepareUpdate(
								protectedFunction((t: TThreadModel) => {
									Object.assign(t, message);
								})
							)
						);
					} else {
						batch.push(
							threadsCollection.prepareCreate(
								protectedFunction((t: TThreadModel) => {
									t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
									if (t.subscription) t.subscription.id = this.rid;
									Object.assign(t, message);
								})
							)
						);
					}
				} catch (e) {
					log(e);
				}
			}

			// Create or update thread message
			if (message.tmid) {
				try {
					const threadMessageRecord = await getThreadMessageById(message._id);
					if (threadMessageRecord) {
						batch.push(
							threadMessageRecord.prepareUpdate(
								protectedFunction((tm: TThreadMessageModel) => {
									Object.assign(tm, message);
									if (message.tmid) {
										tm.rid = message.tmid;
										delete tm.tmid;
									}
								})
							)
						);
					} else {
						batch.push(
							threadMessagesCollection.prepareCreate(
								protectedFunction((tm: TThreadMessageModel) => {
									tm._raw = sanitizedRaw({ id: message._id }, threadMessagesCollection.schema);
									Object.assign(tm, message);
									if (tm.subscription) {
										tm.subscription.id = this.rid;
									}
									if (message.tmid) {
										tm.rid = message.tmid;
										delete tm.tmid;
									}
								})
							)
						);
					}
				} catch (e) {
					log(e);
				}
			}

			await db.write(async () => {
				await db.batch(...batch);
			});
		});

	handleMessageReceived = async (ddpMessage: IDDPMessage) => {
		try {
			const rawMessage = ddpMessage.fields.args[0];
			const message = buildMessage(EJSON.fromJSONValue(rawMessage)) as IMessage;
			await this.updateMessage(message);
			this.read();
		} catch (e) {
			log(e);
		}
	};
}

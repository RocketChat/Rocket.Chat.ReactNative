import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import log from '../helpers/log';
import protectedFunction from '../helpers/protectedFunction';
import buildMessage from '../helpers/buildMessage';
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
	IMessage,
	TMessageModel,
	TSubscriptionModel,
	TThreadMessageModel,
	TThreadModel,
	IDeleteMessageBulkParams
} from '../../../definitions';
import { IDDPMessage } from '../../../definitions/IDDPMessage';
import sdk from '../../services/sdk';
import { readMessages } from '../readMessages';
import { loadMissedMessages } from '../loadMissedMessages';
import { updateLastOpen } from '../updateLastOpen';

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
		console.log(`[RCRN] Subscribing to room ${this.rid}`);
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
		console.log(`[RCRN] Unsubscribing from room ${this.rid}`);
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

	handleNotifyRoomReceived = protectedFunction((ddpMessage: IDDPMessage) => {
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
				if (activities.includes('user-typing')) {
					reduxStore.dispatch(addUserTyping(name));
				}
				if (!activities.length) {
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
			message = await Encryption.decryptMessage(message);

			// Create or update message
			try {
				const messageRecord = await getMessageById(message._id);
				if (messageRecord) {
					batch.push(
						messageRecord.prepareUpdate(
							protectedFunction((m: TMessageModel) => {
								Object.assign(m, message);
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
			const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0])) as IMessage;
			await this.updateMessage(message);
			this.read();
		} catch (e) {
			log(e);
		}
	};
}

import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';

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
import { IMessage, TMessageModel, TSubscriptionModel, TThreadMessageModel, TThreadModel } from '../../../definitions';
import { IDDPMessage } from '../../../definitions/IDDPMessage';
import sdk from '../../services/sdk';
import { readMessages } from '../readMessages';
import { loadMissedMessages } from '../loadMissedMessages';
import { updateLastOpen } from '../updateLastOpen';

const WINDOW_TIME = 1000;

export default class RoomSubscription {
	private rid: string;
	private isAlive: boolean;
	private timer: ReturnType<typeof setTimeout> | null;
	private queue: { [key: string]: IMessage };
	private messagesBatch: {};
	private _messagesBatch: { [key: string]: TMessageModel };
	private threadsBatch: {};
	private _threadsBatch: { [key: string]: TThreadModel };
	private threadMessagesBatch: {};
	private _threadMessagesBatch: { [key: string]: TThreadMessageModel };
	private promises?: Promise<TSubscriptionModel[]>;
	private connectedListener?: Promise<any>;
	private disconnectedListener?: Promise<any>;
	private notifyRoomListener?: Promise<any>;
	private messageReceivedListener?: Promise<any>;
	private lastOpen?: Date;

	constructor(rid: string) {
		this.rid = rid;
		this.isAlive = true;
		this.timer = null;
		this.queue = {};
		this.messagesBatch = {};
		this.threadsBatch = {};
		this.threadMessagesBatch = {};

		this._messagesBatch = {};
		this._threadsBatch = {};
		this._threadMessagesBatch = {};
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
		if (this.timer) {
			clearTimeout(this.timer);
		}
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
			const _lastOpen = new Date();
			this.read(_lastOpen);
			this.lastOpen = _lastOpen;
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
		}
	});

	read = debounce((lastOpen: Date) => {
		readMessages(this.rid, lastOpen);
	}, 300);

	updateMessage = (message: IMessage): Promise<void> =>
		new Promise(async resolve => {
			if (this.rid !== message.rid) {
				return resolve();
			}

			const db = database.active;
			const msgCollection = db.get('messages');
			const threadsCollection = db.get('threads');
			const threadMessagesCollection = db.get('thread_messages');

			// Decrypt the message if necessary
			message = await Encryption.decryptMessage(message);

			// Create or update message
			try {
				let operation = null;
				const messageRecord = await getMessageById(message._id);
				if (messageRecord) {
					operation = messageRecord.prepareUpdate(
						protectedFunction((m: TMessageModel) => {
							Object.assign(m, message);
						})
					);
				} else {
					operation = msgCollection.prepareCreate(
						protectedFunction((m: TMessageModel) => {
							m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
							if (m.subscription) m.subscription.id = this.rid;
							Object.assign(m, message);
						})
					);
				}
				this._messagesBatch[message._id] = operation;
			} catch (e) {
				log(e);
			}

			// Create or update thread
			if (message.tlm) {
				try {
					let operation = null;
					const threadRecord = await getThreadById(message._id);
					if (threadRecord) {
						operation = threadRecord.prepareUpdate(
							protectedFunction((t: TThreadModel) => {
								Object.assign(t, message);
							})
						);
					} else {
						operation = threadsCollection.prepareCreate(
							protectedFunction((t: TThreadModel) => {
								t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
								if (t.subscription) t.subscription.id = this.rid;
								Object.assign(t, message);
							})
						);
					}
					this._threadsBatch[message._id] = operation;
				} catch (e) {
					log(e);
				}
			}

			// Create or update thread message
			if (message.tmid) {
				try {
					let operation = null;
					const threadMessageRecord = await getThreadMessageById(message._id);
					if (threadMessageRecord) {
						operation = threadMessageRecord.prepareUpdate(
							protectedFunction((tm: TThreadMessageModel) => {
								Object.assign(tm, message);
								if (message.tmid) {
									tm.rid = message.tmid;
									delete tm.tmid;
								}
							})
						);
					} else {
						operation = threadMessagesCollection.prepareCreate(
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
						);
					}
					this._threadMessagesBatch[message._id] = operation;
				} catch (e) {
					log(e);
				}
			}

			return resolve();
		});

	handleMessageReceived = (ddpMessage: IDDPMessage) => {
		if (!this.timer) {
			this.timer = setTimeout(async () => {
				// copy variables values to local and clean them
				const _lastOpen = this.lastOpen;
				const _queue = Object.keys(this.queue).map(key => this.queue[key]);
				this._messagesBatch = this.messagesBatch;
				this._threadsBatch = this.threadsBatch;
				this._threadMessagesBatch = this.threadMessagesBatch;
				this.queue = {};
				this.messagesBatch = {};
				this.threadsBatch = {};
				this.threadMessagesBatch = {};
				this.timer = null;

				for (let i = 0; i < _queue.length; i += 1) {
					try {
						// eslint-disable-next-line no-await-in-loop
						await this.updateMessage(_queue[i]);
					} catch (e) {
						log(e);
					}
				}

				try {
					const db = database.active;
					await db.write(async () => {
						await db.batch(
							...Object.values(this._messagesBatch),
							...Object.values(this._threadsBatch),
							...Object.values(this._threadMessagesBatch)
						);
					});

					this.read(_lastOpen);
				} catch (e) {
					log(e);
				}

				// Clean local variables
				this._messagesBatch = {};
				this._threadsBatch = {};
				this._threadMessagesBatch = {};
			}, WINDOW_TIME);
		}
		this.lastOpen = new Date();
		const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0])) as IMessage;
		this.queue[message._id] = message;
	};
}

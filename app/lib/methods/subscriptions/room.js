import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';

import log from '../../../utils/log';
import protectedFunction from '../helpers/protectedFunction';
import buildMessage from '../helpers/buildMessage';
import database from '../../database';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import { getThreadMessageById } from '../../database/services/ThreadMessage';
import reduxStore from '../../createStore';
import { addUserTyping, clearUserTyping, removeUserTyping } from '../../../actions/usersTyping';
import debounce from '../../../utils/debounce';
import RocketChat from '../../rocketchat';
import { subscribeRoom, unsubscribeRoom } from '../../../actions/room';
import { Encryption } from '../../encryption';

const WINDOW_TIME = 1000;

export default class RoomSubscription {
	constructor(rid) {
		this.rid = rid;
		this.isAlive = true;
		this.timer = null;
		this.queue = {};
		this.messagesBatch = {};
		this.threadsBatch = {};
		this.threadMessagesBatch = {};
	}

	subscribe = async () => {
		console.log(`[RCRN] Subscribing to room ${this.rid}`);
		if (this.promises) {
			await this.unsubscribe();
		}
		this.promises = RocketChat.subscribeRoom(this.rid);

		this.connectedListener = RocketChat.onStreamData('connected', this.handleConnection);
		this.disconnectedListener = RocketChat.onStreamData('close', this.handleConnection);
		this.notifyRoomListener = RocketChat.onStreamData('stream-notify-room', this.handleNotifyRoomReceived);
		this.messageReceivedListener = RocketChat.onStreamData('stream-room-messages', this.handleMessageReceived);
		if (!this.isAlive) {
			this.unsubscribe();
		}

		reduxStore.dispatch(subscribeRoom(this.rid));
	};

	unsubscribe = async () => {
		console.log(`[RCRN] Unsubscribing from room ${this.rid}`);
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

	removeListener = async promise => {
		if (promise) {
			try {
				const listener = await promise;
				listener.stop();
			} catch (e) {
				// do nothing
			}
		}
	};

	handleConnection = () => {
		reduxStore.dispatch(clearUserTyping());
		RocketChat.loadMissedMessages({ rid: this.rid }).catch(e => console.log(e));
	};

	handleNotifyRoomReceived = protectedFunction(ddpMessage => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (this.rid !== _rid) {
			return;
		}
		if (ev === 'typing') {
			const { user } = reduxStore.getState().login;
			const { UI_Use_Real_Name } = reduxStore.getState().settings;
			const { rooms } = reduxStore.getState().room;
			if (rooms[0] !== _rid) {
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
		} else if (ev === 'deleteMessage') {
			InteractionManager.runAfterInteractions(async () => {
				if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
					try {
						const { _id } = ddpMessage.fields.args[0];
						const db = database.active;
						const msgCollection = db.get('messages');
						const threadsCollection = db.get('threads');
						const threadMessagesCollection = db.get('thread_messages');
						let deleteMessage;
						let deleteThread;
						let deleteThreadMessage;

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
						await db.action(async () => {
							await db.batch(deleteMessage, deleteThread, deleteThreadMessage);
						});
					} catch (e) {
						log(e);
					}
				}
			});
		}
	});

	read = debounce(lastOpen => {
		RocketChat.readMessages(this.rid, lastOpen);
	}, 300);

	updateMessage = message =>
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
						protectedFunction(m => {
							Object.assign(m, message);
						})
					);
				} else {
					operation = msgCollection.prepareCreate(
						protectedFunction(m => {
							m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
							m.subscription.id = this.rid;
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
							protectedFunction(t => {
								Object.assign(t, message);
							})
						);
					} else {
						operation = threadsCollection.prepareCreate(
							protectedFunction(t => {
								t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
								t.subscription.id = this.rid;
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
							protectedFunction(tm => {
								Object.assign(tm, message);
								tm.rid = message.tmid;
								delete tm.tmid;
							})
						);
					} else {
						operation = threadMessagesCollection.prepareCreate(
							protectedFunction(tm => {
								tm._raw = sanitizedRaw({ id: message._id }, threadMessagesCollection.schema);
								Object.assign(tm, message);
								tm.subscription.id = this.rid;
								tm.rid = message.tmid;
								delete tm.tmid;
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

	handleMessageReceived = ddpMessage => {
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
					await db.action(async () => {
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
		const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0]));
		this.queue[message._id] = message;
	};
}

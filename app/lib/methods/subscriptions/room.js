import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';

import log from '../../../utils/log';
import protectedFunction from '../helpers/protectedFunction';
import buildMessage from '../helpers/buildMessage';
import database from '../../database';
import reduxStore from '../../createStore';
import { addUserTyping, removeUserTyping, clearUserTyping } from '../../../actions/usersTyping';
import debounce from '../../../utils/debounce';
import RocketChat from '../../rocketchat';

let queue = {};
let timer = null;
const WINDOW_TIME = 2000;

export default class RoomSubscription {
	constructor(rid) {
		this.rid = rid;
		this.isAlive = true;
		this.messagesBatch = {};
		this.threadsBatch = {};
		this.threadMessagesBatch = {};
	}

	subscribe = async() => {
		console.log(`[RCRN] Subscribing to room ${ this.rid }`);
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
	}

	unsubscribe = async() => {
		console.log(`[RCRN] Unsubscribing from room ${ this.rid }`);
		this.isAlive = false;
		if (this.promises) {
			try {
				const subscriptions = await this.promises || [];
				subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
			} catch (e) {
				// do nothing
			}
		}
		this.removeListener(this.connectedListener);
		this.removeListener(this.disconnectedListener);
		this.removeListener(this.notifyRoomListener);
		this.removeListener(this.messageReceivedListener);
		reduxStore.dispatch(clearUserTyping());
	}

	removeListener = async(promise) => {
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
		RocketChat.loadMissedMessages({ rid: this.rid }).catch(e => console.log(e));
	};

	handleNotifyRoomReceived = protectedFunction((ddpMessage) => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (this.rid !== _rid) {
			return;
		}
		if (ev === 'typing') {
			const [username, typing] = ddpMessage.fields.args;
			if (typing) {
				reduxStore.dispatch(addUserTyping(username));
			} else {
				reduxStore.dispatch(removeUserTyping(username));
			}
		} else if (ev === 'deleteMessage') {
			InteractionManager.runAfterInteractions(async() => {
				if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
					try {
						const { _id } = ddpMessage.fields.args[0];
						const db = database.active;
						const msgCollection = db.collections.get('messages');
						const threadsCollection = db.collections.get('threads');
						const threadMessagesCollection = db.collections.get('thread_messages');
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
						await db.action(async() => {
							await db.batch(
								deleteMessage, deleteThread, deleteThreadMessage
							);
						});
					} catch (e) {
						log(e);
					}
				}
			});
		}
	});

	read = debounce((lastOpen) => {
		RocketChat.readMessages(this.rid, lastOpen);
	}, 300);

	callMessageReceived = async(message, lastOpen) => {
		return new Promise(async(resolve, reject) => {
			console.log('TCL: RoomSubscription -> callMessageReceived -> message', message);
			// if (this.rid !== message.rid) {
			// 	return;
			// }

			const db = database.active;
			const batch = [];
			const msgCollection = db.collections.get('messages');
			const threadsCollection = db.collections.get('threads');
			const threadMessagesCollection = db.collections.get('thread_messages');
			let messageRecord;
			let threadRecord;
			let threadMessageRecord;

			// Create or update message
			try {
				messageRecord = await msgCollection.find(message._id);
			} catch (error) {
				// Do nothing
			}
			if (messageRecord) {
				try {
					const update = messageRecord.prepareUpdate((m) => {
						Object.assign(m, message);
					});
					this.messagesBatch[message._id] = update;
					// batch.push(update);
				} catch (e) {
					console.log(e);
				}
			} else {
				// batch.push(
				// 	msgCollection.prepareCreate(protectedFunction((m) => {
				// 		m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
				// 		m.subscription.id = this.rid;
				// 		Object.assign(m, message);
				// 	}))
				// );
				const create = msgCollection.prepareCreate(protectedFunction((m) => {
					m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
					m.subscription.id = this.rid;
					Object.assign(m, message);
				}));
				this.messagesBatch[message._id] = create;
			}
	
			// Create or update thread
			if (message.tlm) {
				try {
					threadRecord = await threadsCollection.find(message._id);
				} catch (error) {
					// Do nothing
				}
	
				if (threadRecord) {
					// batch.push(
					// 	threadRecord.prepareUpdate(protectedFunction((t) => {
					// 		Object.assign(t, message);
					// 	}))
					// );
					const updateThread = threadRecord.prepareUpdate(protectedFunction((t) => {
						Object.assign(t, message);
					}));
					this.threadsBatch[message._id] = updateThread;
				} else {
					// batch.push(
					// 	threadsCollection.prepareCreate(protectedFunction((t) => {
					// 		t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
					// 		t.subscription.id = this.rid;
					// 		Object.assign(t, message);
					// 	}))
					// );
					const createThread = threadsCollection.prepareCreate(protectedFunction((t) => {
						t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
						t.subscription.id = this.rid;
						Object.assign(t, message);
					}));
					this.threadsBatch[message._id] = createThread;
				}
			}

			// Create or update thread message
			if (message.tmid) {
				try {
					threadMessageRecord = await threadMessagesCollection.find(message._id);
				} catch (error) {
					// Do nothing
				}

				if (threadMessageRecord) {
					// batch.push(
					// 	threadMessageRecord.prepareUpdate(protectedFunction((tm) => {
					// 		Object.assign(tm, message);
					// 		tm.rid = message.tmid;
					// 		delete tm.tmid;
					// 	}))
					// );
					const updateThreadMessage = threadMessageRecord.prepareUpdate(protectedFunction((tm) => {
						Object.assign(tm, message);
						tm.rid = message.tmid;
						delete tm.tmid;
					}));
					this.threadMessagesBatch[message._id] = updateThreadMessage;
				} else {
					// batch.push(
					// 	threadMessagesCollection.prepareCreate(protectedFunction((tm) => {
					// 		tm._raw = sanitizedRaw({ id: message._id }, threadMessagesCollection.schema);
					// 		Object.assign(tm, message);
					// 		tm.subscription.id = this.rid;
					// 		tm.rid = message.tmid;
					// 		delete tm.tmid;
					// 	}))
					// );
					const createThreadMessage = threadMessagesCollection.prepareCreate(protectedFunction((tm) => {
						tm._raw = sanitizedRaw({ id: message._id }, threadMessagesCollection.schema);
						Object.assign(tm, message);
						tm.subscription.id = this.rid;
						tm.rid = message.tmid;
						delete tm.tmid;
					}));
					this.threadMessagesBatch[message._id] = createThreadMessage;
				}
			}

			// this.read(lastOpen);
			return resolve('FOI FOI FOI FOI FOI FOI FOI FOI FOI ');

			// try {
			// 	await db.action(async() => {
			// 		await db.batch(...batch);
			// 	});
			// 	return resolve('FOI FOI FOI FOI FOI FOI FOI FOI FOI ');
			// } catch (e) {
			// 	log(e);
			// }
		});
	};

	handleMessageReceived = (ddpMessage) => {
    console.log('TCL: RoomSubscription -> handleMessageReceived -> ddpMessage', ddpMessage);
		if (!timer) {
			timer = setTimeout(async() => {
				const innerQueue = Object.keys(queue).map(key => queue[key]);
        console.log('TCL: RoomSubscription -> timer -> innerQueue', innerQueue);
				const innerLastOpen = this.lastOpen;
				queue = {};
				timer = null;
				for (let i = 0; i < innerQueue.length; i += 1) {
					try {
						// eslint-disable-next-line no-await-in-loop
						const r = await this.callMessageReceived(innerQueue[i], innerLastOpen);
            console.log('TCL: RoomSubscription -> timer -> r', r);
					} catch (e) {
						console.log('TCL: RoomSubscription -> timer -> e', e);
					}
				}

				try {
					console.log('BEFOOOOOOOOOOOORE')
					const db = database.active;
					console.log(this.messagesBatch)
					console.log(this.threadsBatch)
					console.log(this.threadMessagesBatch)
					await db.action(async() => {
						await db.batch(
							...Object.values(this.messagesBatch),
							...Object.values(this.threadsBatch),
							...Object.values(this.threadMessagesBatch),
						);
					});
					console.log('AFTEEEEEEEEEEEER')
					this.messagesBatch = {};
					this.threadsBatch = {};
					this.threadMessagesBatch = {};

					this.read(innerLastOpen);
				} catch (e) {
					log(e);
				}
			}, WINDOW_TIME);
		}
		const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0]));
		this.lastOpen = new Date();
		queue[message._id] = message;
	};
}

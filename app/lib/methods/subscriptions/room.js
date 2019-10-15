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

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
const removeListener = listener => listener.stop();

export default function subscribeRoom({ rid }) {
	console.log(`[RCRN] Subscribed to room ${ rid }`);
	let promises;
	let connectedListener;
	let disconnectedListener;
	let notifyRoomListener;
	let messageReceivedListener;

	const handleConnection = () => {
		this.loadMissedMessages({ rid }).catch(e => console.log(e));
	};

	const handleNotifyRoomReceived = protectedFunction((ddpMessage) => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (rid !== _rid) {
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

	const read = debounce((lastOpen) => {
		this.readMessages(rid, lastOpen);
	}, 300);

	const handleMessageReceived = protectedFunction((ddpMessage) => {
		const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0]));
		const lastOpen = new Date();
		if (rid !== message.rid) {
			return;
		}
		InteractionManager.runAfterInteractions(async() => {
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
				batch.push(
					messageRecord.prepareUpdate(protectedFunction((m) => {
						Object.assign(m, message);
					}))
				);
			} else {
				batch.push(
					msgCollection.prepareCreate(protectedFunction((m) => {
						m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
						m.subscription.id = rid;
						Object.assign(m, message);
					}))
				);
			}

			// Create or update thread
			if (message.tlm) {
				try {
					threadRecord = await threadsCollection.find(message._id);
				} catch (error) {
					// Do nothing
				}

				if (threadRecord) {
					batch.push(
						threadRecord.prepareUpdate(protectedFunction((t) => {
							Object.assign(t, message);
						}))
					);
				} else {
					batch.push(
						threadsCollection.prepareCreate(protectedFunction((t) => {
							t._raw = sanitizedRaw({ id: message._id }, threadsCollection.schema);
							t.subscription.id = rid;
							Object.assign(t, message);
						}))
					);
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
					batch.push(
						threadMessageRecord.prepareUpdate(protectedFunction((tm) => {
							Object.assign(tm, message);
							tm.rid = message.tmid;
							delete tm.tmid;
						}))
					);
				} else {
					batch.push(
						threadMessagesCollection.prepareCreate(protectedFunction((tm) => {
							tm._raw = sanitizedRaw({ id: message._id }, threadMessagesCollection.schema);
							Object.assign(tm, message);
							tm.subscription.id = rid;
							tm.rid = message.tmid;
							delete tm.tmid;
						}))
					);
				}
			}

			read(lastOpen);

			try {
				await db.action(async() => {
					await db.batch(...batch);
				});
			} catch (e) {
				log(e);
			}
		});
	});

	const stop = () => {
		if (promises) {
			promises.then(unsubscribe);
			promises = false;
		}
		if (connectedListener) {
			connectedListener.then(removeListener);
			connectedListener = false;
		}
		if (disconnectedListener) {
			disconnectedListener.then(removeListener);
			disconnectedListener = false;
		}
		if (notifyRoomListener) {
			notifyRoomListener.then(removeListener);
			notifyRoomListener = false;
		}
		if (messageReceivedListener) {
			messageReceivedListener.then(removeListener);
			messageReceivedListener = false;
		}
		reduxStore.dispatch(clearUserTyping());
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnection);
	disconnectedListener = this.sdk.onStreamData('close', handleConnection);
	notifyRoomListener = this.sdk.onStreamData('stream-notify-room', handleNotifyRoomReceived);
	messageReceivedListener = this.sdk.onStreamData('stream-room-messages', handleMessageReceived);

	try {
		promises = this.sdk.subscribeRoom(rid);
	} catch (e) {
		log(e);
	}

	return {
		stop: () => stop()
	};
}

import EJSON from 'ejson';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { InteractionManager } from 'react-native';

import log from '../../../utils/log';
import protectedFunction from '../helpers/protectedFunction';
import buildMessage from '../helpers/buildMessage';
import database from '../../realm';
import watermelondb from '../../database';
import debounce from '../../../utils/debounce';

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
const removeListener = listener => listener.stop();

export default function subscribeRoom({ rid }) {
	let promises;
	let connectedListener;
	let disconnectedListener;
	let notifyRoomListener;
	let messageReceivedListener;
	const typingTimeouts = {};

	const handleConnection = () => {
		this.loadMissedMessages({ rid });
	};

	const getUserTyping = username => (
		database
			.memoryDatabase.objects('usersTyping')
			.filtered('rid = $0 AND username = $1', rid, username)
	);

	const removeUserTyping = (username) => {
		const userTyping = getUserTyping(username);
		try {
			database.memoryDatabase.write(() => {
				database.memoryDatabase.delete(userTyping);
			});

			if (typingTimeouts[username]) {
				clearTimeout(typingTimeouts[username]);
				typingTimeouts[username] = null;
			}
		} catch (e) {
			log(e);
		}
	};

	const addUserTyping = (username) => {
		const userTyping = getUserTyping(username);
		// prevent duplicated
		if (userTyping.length === 0) {
			try {
				database.memoryDatabase.write(() => {
					database.memoryDatabase.create('usersTyping', { rid, username });
				});

				if (typingTimeouts[username]) {
					clearTimeout(typingTimeouts[username]);
					typingTimeouts[username] = null;
				}

				typingTimeouts[username] = setTimeout(() => {
					removeUserTyping(username);
				}, 10000);
			} catch (e) {
				log(e);
			}
		}
	};

	const handleNotifyRoomReceived = protectedFunction((ddpMessage) => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (rid !== _rid) {
			return;
		}
		if (ev === 'typing') {
			const [username, typing] = ddpMessage.fields.args;
			if (typing) {
				addUserTyping(username);
			} else {
				removeUserTyping(username);
			}
		} else if (ev === 'deleteMessage') {
			database.write(() => {
				if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
					const { _id } = ddpMessage.fields.args[0];
					const message = database.objects('messages').filtered('_id = $0', _id);
					database.delete(message);
					const thread = database.objects('threads').filtered('_id = $0', _id);
					database.delete(thread);
					const threadMessage = database.objects('threadMessages').filtered('_id = $0', _id);
					database.delete(threadMessage);
					const cleanTmids = database.objects('messages').filtered('tmid = $0', _id).snapshot();
					if (cleanTmids && cleanTmids.length) {
						cleanTmids.forEach((m) => {
							m.tmid = null;
						});
					}
				}
			});
		}
	});

	const handleMessageReceived = protectedFunction(async(ddpMessage) => {
		const message = buildMessage(EJSON.fromJSONValue(ddpMessage.fields.args[0]));
		if (rid !== message.rid) {
			return;
		}
		InteractionManager.runAfterInteractions(async() => {
			const watermelon = watermelondb.database;
			const batch = [];
			const subCollection = watermelon.collections.get('subscriptions');
			const msgCollection = watermelon.collections.get('messages');
			const threadsCollection = watermelon.collections.get('threads');
			const threadMessagesCollection = watermelon.collections.get('thread_messages');

			// Create or update message
			try {
				const messageRecord = await msgCollection.find(message._id);
				batch.push(
					messageRecord.prepareUpdate((m) => {
						Object.assign(m, message);
					})
				);
			} catch (error) {
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
					const threadRecord = await threadsCollection.find(message._id);
					batch.push(
						threadRecord.prepareUpdate((t) => {
							Object.assign(t, message);
						})
					);
				} catch (error) {
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
					const threadMessageRecord = await threadMessagesCollection.find(message._id);
					batch.push(
						threadMessageRecord.prepareUpdate((tm) => {
							Object.assign(tm, message);
							tm.rid = message.tmid;
							delete tm.tmid;
						})
					);
				} catch (error) {
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

			try {
				await subCollection.find(rid);
				this.readMessages(rid);
			} catch (e) {
				console.log('Subscription not found. We probably subscribed to a not joined channel. No need to mark as read.');
			}

			try {
				await watermelon.action(async() => {
					await watermelon.batch(...batch);
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
		Object.keys(typingTimeouts).forEach((key) => {
			if (typingTimeouts[key]) {
				clearTimeout(typingTimeouts[key]);
				typingTimeouts[key] = null;
			}
		});
		database.memoryDatabase.write(() => {
			const usersTyping = database.memoryDatabase.objects('usersTyping').filtered('rid == $0', rid);
			database.memoryDatabase.delete(usersTyping);
		});
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

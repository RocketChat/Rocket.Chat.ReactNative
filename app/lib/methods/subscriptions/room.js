import log from '../../../utils/log';
import protectedFunction from '../helpers/protectedFunction';
import database from '../../realm';

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
const removeListener = listener => listener.stop();

export default function subscribeRoom({ rid }) {
	let streamListener;
	let promises;
	let timer = null;
	let connectedListener;
	let disconnectedListener;
	const typingTimeouts = {};
	const loop = () => {
		if (timer) {
			return;
		}
		timer = setTimeout(() => {
			try {
				clearTimeout(timer);
				timer = false;
				this.loadMissedMessages({ rid });
				loop();
			} catch (e) {
				loop();
			}
		}, 5000);
	};

	const handleConnected = () => {
		this.loadMissedMessages({ rid });
		clearTimeout(timer);
		timer = false;
	};

	const handleDisconnected = () => {
		if (this.sdk.userId) {
			loop();
		}
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
		} catch (error) {
			console.log('TCL: removeUserTyping -> error', error);
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
			} catch (error) {
				console.log('TCL: addUserTyping -> error', error);
			}
		}
	};

	const handleStreamReceived = protectedFunction((ddpMessage) => {
		const [_rid, ev] = ddpMessage.fields.eventName.split('/');
		if (rid !== _rid) {
			return;
		}
		if (ev === 'typing') {
			const [username, typing] = ddpMessage.fields.args;
			try {
				if (typing) {
					addUserTyping(username);
				} else {
					removeUserTyping(username);
				}
			} catch (error) {
				console.log('TCL: handleStreamReceived -> typing -> error', error);
			}
		} else if (ev === 'deleteMessage') {
			database.write(() => {
				if (ddpMessage && ddpMessage.fields && ddpMessage.fields.args.length > 0) {
					const { _id } = ddpMessage.fields.args[0];
					const message = database.objects('messages').filtered('_id = $0', _id);
					database.delete(message);
				}
			});
		}
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
		if (streamListener) {
			streamListener.then(removeListener);
			streamListener = false;
		}
		clearTimeout(timer);
		timer = false;
		Object.keys(typingTimeouts).forEach((key) => {
			if (typingTimeouts[key]) {
				clearTimeout(typingTimeouts[key]);
				typingTimeouts[key] = null;
			}
		});
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnected);
	disconnectedListener = this.sdk.onStreamData('close', handleDisconnected);
	streamListener = this.sdk.onStreamData('stream-notify-room', handleStreamReceived);

	try {
		promises = this.sdk.subscribeRoom(rid);
	} catch (e) {
		log('subscribeRoom', e);
	}

	return {
		stop: () => stop()
	};
}
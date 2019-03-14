import log from '../../../utils/log';

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));
const removeListener = listener => listener.stop();

let promises;
let timer = null;
let connectedListener;
let disconnectedListener;

export default function subscribeRoom({ rid }) {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}
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
		clearTimeout(timer);
		timer = false;
	};

	connectedListener = this.sdk.onStreamData('connected', handleConnected);
	disconnectedListener = this.sdk.onStreamData('close', handleDisconnected);

	try {
		promises = this.sdk.subscribeRoom(rid);
	} catch (e) {
		log('subscribeRoom', e);
	}

	return {
		stop: () => stop()
	};
}

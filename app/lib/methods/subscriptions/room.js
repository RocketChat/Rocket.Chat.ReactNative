import log from '../../../utils/log';

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));

let promises;
let timer = null;

const stop = () => {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}

	clearTimeout(timer);
};

export default function subscribeRoom({ rid }) {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}
	const loop = () => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			try {
				clearTimeout(timer);
				timer = false;
				if (this.sdk.userId) {
					await this.loadMissedMessages({ rid });
					loop();
				}
			} catch (e) {
				loop();
			}
		}, 5000);
	};

	this.sdk.onStreamData('connected', () => {
		if (this.sdk.userId) {
			this.loadMissedMessages({ rid });
		}
		clearTimeout(timer);
		timer = false;
	});

	this.sdk.onStreamData('close', () => {
		loop();
	});

	try {
		promises = this.sdk.subscribeRoom(rid);
	} catch (e) {
		log('subscribeRoom', e);
	}

	return {
		stop: () => stop()
	};
}

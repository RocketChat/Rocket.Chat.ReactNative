import log from '../../../utils/log';

const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));

let timer = null;
let promises;

const stop = () => {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}

	clearTimeout(timer);
};

export default function subscribeRoom({ rid, t }) {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}
	const loop = (time = new Date()) => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			try {
				await this.loadMissedMessages({ rid, t });
				timer = false;
				loop();
			} catch (e) {
				loop(time);
			}
		}, 5000);
	};

	this.sdk.onStreamData('logged', () => {
		clearTimeout(timer);
		timer = false;
	});

	this.sdk.onStreamData('disconnected', () => {
		if (this.sdk.userId) {
			loop();
		}
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

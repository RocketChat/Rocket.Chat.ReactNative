import * as SDK from '@rocket.chat/sdk';

import log from '../../../utils/log';

const subscribe = rid => Promise.all([
	SDK.driver.subscribe('stream-room-messages', rid, false),
	SDK.driver.subscribe('stream-notify-room', `${ rid }/typing`, false),
	SDK.driver.subscribe('stream-notify-room', `${ rid }/deleteMessage`, false)
]);
const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch((e) => {
	log('unsubscribeRoom', e);
}));

let timer = null;
let promises;

const stop = () => {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}

	clearTimeout(timer);
};

export default async function subscribeRoom({ rid, t }) {
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

	if (!SDK.driver.ddp && SDK.driver.userId) {
		loop();
	} else {
		SDK.driver.on('logged', () => {
			clearTimeout(timer);
			timer = false;
		});

		SDK.driver.on('disconnected', () => {
			if (SDK.driver.userId) {
				loop();
			}
		});

		try {
			promises = subscribe(rid);
		} catch (e) {
			log('subscribeRoom', e);
		}
	}

	return {
		stop: () => stop()
	};
}

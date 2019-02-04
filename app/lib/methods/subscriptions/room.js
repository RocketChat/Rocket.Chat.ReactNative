import log from '../../../utils/log';

// const subscribe = rid => Promise.all([
// 	SDK.driver.subscribe('stream-room-messages', rid, false),
// 	SDK.driver.subscribe('stream-notify-room', `${ rid }/typing`, false),
// 	SDK.driver.subscribe('stream-notify-room', `${ rid }/deleteMessage`, false)
// ]);
const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(() => console.log('unsubscribeRoom')));

let timer = null;
let promises;

const stop = () => {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}
	console.log('TCL: stop -> promises', promises);

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
		// promises = subscribe(rid);
		promises = await this.sdk.subscribeRoom(rid);
		console.log('TCL: subscribeRoom -> promises', promises);
	} catch (e) {
		log('subscribeRoom', e);
	}

	return {
		stop: () => stop()
	};
}

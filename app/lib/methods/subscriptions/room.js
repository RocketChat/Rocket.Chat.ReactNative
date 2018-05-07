// import database from '../../realm';
// import reduxStore from '../../createStore';
// import normalizeMessage from '../helpers/normalizeMessage';
// import _buildMessage from '../helpers/buildMessage';
// import protectedFunction from '../helpers/protectedFunction';

const subscribe = (ddp, rid) => Promise.all([
	ddp.subscribe('stream-room-messages', rid, false),
	ddp.subscribe('stream-notify-room', `${ rid }/typing`, false)
]);
const unsubscribe = subscriptions => subscriptions.forEach(sub => sub.unsubscribe().catch(e => console.warn(e)));

let timer = null;
let promises;
let logged;
let disconnected;

const stop = (ddp) => {
	if (promises) {
		promises.then(unsubscribe);
		promises = false;
	}

	if (ddp) {
		ddp.removeListener('logged', logged);
		ddp.removeListener('disconnected', disconnected);
	}

	logged = false;
	disconnected = false;

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
				await this.loadMissedMessages({ rid, t, lastOpen: timer });
				timer = false;
				loop();
			} catch (e) {
				loop(time);
			}
		}, 5000);
	};

	if (!this.ddp || !this.ddp.status) {
		loop();
	} else {
		logged = this.ddp.on('logged', () => {
			clearTimeout(timer);
			timer = false;
			promises = subscribe(this.ddp, rid);
		});

		disconnected = this.ddp.on('disconnected', () => {
			if (this._login) {
				loop();
			}
		});

		promises = subscribe(this.ddp, rid);
	}

	return {
		stop: () => stop(this.ddp)
	};
}

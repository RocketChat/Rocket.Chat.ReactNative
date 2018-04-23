// import database from '../../realm';
// import reduxStore from '../../createStore';
// import normalizeMessage from '../helpers/normalizeMessage';
// import _buildMessage from '../helpers/buildMessage';
// import protectedFunction from '../helpers/protectedFunction';

let timer = null;
export default async function subscribeRoom({ rid, t }) {
	const loop = (time = new Date()) => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			try {
				await this.loadMissedMessages({ rid, t, latest: timer });
				timer = false;
				loop();
			} catch (e) {
				loop(time);
			}
		}, 5000);
	};

	const promises = Promise.all([
		this.ddp.subscribe('stream-room-messages', rid, false),
		this.ddp.subscribe('stream-notify-room', `${ rid }/typing`, false)
	]);

	if (!this.ddp.status) {
		loop();
	}

	this.ddp.on('logged', () => {
		clearTimeout(timer);
		timer = false;
	});

	this.ddp.on('disconnected', () => { loop(); });
	const subscriptions = await promises;
	return {
		stop() {
			subscriptions.forEach(sub => sub.unsubscribe().catch(e => alert(e)));
			clearTimeout(timer);
		}
	};
}

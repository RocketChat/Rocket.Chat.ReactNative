// import database from '../../realm';
import { roomMessageReceived } from '../../../actions/room';
import reduxStore from '../../createStore';
// import normalizeMessage from '../helpers/normalizeMessage';
import _buildMessage from '../helpers/buildMessage';
import protectedFunction from '../helpers/protectedFunction';

export default async function subscribeRoom({ rid, t }) {
	const subscriptions = await Promise.all([
		this.ddp.subscribe('stream-room-messages', rid, false),
		this.ddp.subscribe('stream-notify-room', `${ rid }/typing`, false),
		this.ddp.subscribe('stream-notify-user', `${ rid }/message`, false)
	]);
	this.ddp.on('stream-room-messages', protectedFunction((ddpMessage) => {
		const message = _buildMessage(ddpMessage.fields.args[0]);
		return reduxStore.dispatch(roomMessageReceived(message));
	}));

	let timer = null;
	const loop = (time = new Date()) => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			timer = false;
			try {
				await this.loadMessagesForRoom({ rid, t, latest: timer });
				loop();
			} catch (e) {
				loop(time);
			}
		}, 5000);
	};

	this.ddp.on('logged', () => {
		clearTimeout(timer);
		timer = false;
	});

	this.ddp.on('disconnected', () => { loop(); });

	return {
		stop() {
			subscriptions.forEach(sub => sub.unsubscribe().catch(e => console.warn('room', e)));
			clearTimeout(timer);
		}
	};
}

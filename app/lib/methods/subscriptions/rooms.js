import database from '../../realm';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';
import random from '../../../utils/random';

export default async function subscribeRooms() {
	let timer = null;
	const loop = () => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			try {
				clearTimeout(timer);
				timer = false;
				if (this.sdk.userId) {
					await this.getRooms();
					loop();
				}
			} catch (e) {
				loop();
			}
		}, 5000);
	};

	this.sdk.onStreamData('connected', () => {
		if (this.sdk.userId) {
			this.getRooms();
		}
		clearTimeout(timer);
		timer = false;
	});

	this.sdk.onStreamData('close', () => {
		loop();
	});

	this.sdk.onStreamData('stream-notify-user', protectedFunction((ddpMessage) => {
		if (ddpMessage.msg === 'added') {
			return;
		}
		const [type, data] = ddpMessage.fields.args;
		const [, ev] = ddpMessage.fields.eventName.split('/');
		if (/subscriptions/.test(ev)) {
			if (type === 'removed') {
				let messages = [];
				const [subscription] = database.objects('subscriptions').filtered('_id == $0', data._id);

				if (subscription) {
					messages = database.objects('messages').filtered('rid == $0', subscription.rid);
				}
				database.write(() => {
					database.delete(messages);
					database.delete(subscription);
				});
			} else {
				const rooms = database.objects('rooms').filtered('_id == $0', data.rid);
				const tpm = merge(data, rooms[0]);
				database.write(() => {
					database.create('subscriptions', tpm, true);
					database.delete(rooms);
				});
			}
		}
		if (/rooms/.test(ev)) {
			if (type === 'updated') {
				const [sub] = database.objects('subscriptions').filtered('rid == $0', data._id);
				database.write(() => {
					const tmp = merge(sub, data);
					database.create('subscriptions', tmp, true);
				});
			} else if (type === 'inserted') {
				database.write(() => {
					database.create('rooms', data, true);
				});
			}
		}
		if (/message/.test(ev)) {
			const [args] = ddpMessage.fields.args;
			const _id = random(17);
			const message = {
				_id,
				rid: args.rid,
				msg: args.msg,
				ts: new Date(),
				_updatedAt: new Date(),
				status: messagesStatus.SENT,
				u: {
					_id,
					username: 'rocket.cat'
				}
			};
			requestAnimationFrame(() => database.write(() => {
				database.create('messages', message, true);
			}));
		}
	}));

	try {
		await this.sdk.subscribeNotifyUser();
	} catch (e) {
		log('subscribeRooms', e);
	}
}

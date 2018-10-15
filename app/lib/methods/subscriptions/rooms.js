import Random from 'react-native-meteor/lib/Random';
import * as SDK from '@rocket.chat/sdk';

import database from '../../realm';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';

export default async function subscribeRooms(id) {
	const promises = Promise.all([
		SDK.driver.subscribe('stream-notify-user', `${ id }/subscriptions-changed`, false),
		SDK.driver.subscribe('stream-notify-user', `${ id }/rooms-changed`, false),
		SDK.driver.subscribe('stream-notify-user', `${ id }/message`, false)
	]);

	let timer = null;
	const loop = (time = new Date()) => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			try {
				await this.getRooms(time);
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

		SDK.driver.on('logout', () => {
			clearTimeout(timer);
			timer = true;
		});

		SDK.driver.on('disconnected', () => {
			if (this._login) {
				loop();
			}
		});

		SDK.driver.on('stream-notify-user', protectedFunction((e, ddpMessage) => {
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
						merge(sub, data);
					});
				} else if (type === 'inserted') {
					database.write(() => {
						database.create('rooms', data, true);
					});
				}
			}
			if (/message/.test(ev)) {
				const [args] = ddpMessage.fields.args;
				const _id = Random.id();
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
	}

	try {
		await promises;
	} catch (e) {
		log('subscribeRooms', e);
	}
}

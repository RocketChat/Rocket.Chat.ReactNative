import Random from 'react-native-meteor/lib/Random';
import database from '../../realm';
import { merge } from '../helpers/mergeSubscriptionsRooms';
import protectedFunction from '../helpers/protectedFunction';
import messagesStatus from '../../../constants/messagesStatus';
import log from '../../../utils/log';

export default async function subscribeRooms(id) {
	const subscriptions = Promise.all([
		this.ddp.subscribe('stream-notify-user', `${ id }/subscriptions-changed`, false),
		this.ddp.subscribe('stream-notify-user', `${ id }/rooms-changed`, false),
		this.ddp.subscribe('stream-notify-user', `${ id }/message`, false)
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

	if (!this.ddp && this._login) {
		loop();
	} else {
		this.ddp.on('logged', () => {
			clearTimeout(timer);
			timer = false;
		});

		this.ddp.on('logout', () => {
			clearTimeout(timer);
			timer = true;
		});

		this.ddp.on('disconnected', () => {
			if (this._login) {
				loop();
			}
		});

		this.ddp.on('stream-notify-user', protectedFunction((ddpMessage) => {
			const [type, data] = ddpMessage.fields.args;
			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (/subscriptions/.test(ev)) {
				const rooms = database.objects('rooms').filtered('_id == $0', data.rid);
				const tpm = merge(data, rooms[0]);
				database.write(() => {
					database.create('subscriptions', tpm, true);
					database.delete(rooms);
				});
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
		await subscriptions;
	} catch (e) {
		log('subscribeRooms', e);
	}
	// console.log(this.ddp.subscriptions);
}

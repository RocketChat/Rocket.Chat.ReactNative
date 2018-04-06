import database from '../../realm';
import normalizeMessage from '../helpers/normalizeMessage';

export default function subscribeRooms(id) {
	this.ddp.subscribe('stream-notify-user', `${ id }/subscriptions-changed`, false);
	this.ddp.subscribe('stream-notify-user', `${ id }/rooms-changed`, false);

	let timer = null;
	const loop = (time = new Date()) => {
		if (timer) {
			return;
		}
		timer = setTimeout(async() => {
			timer = false;
			try {
				await this.getRooms(time);
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

	this.ddp.on('stream-notify-user', (ddpMessage) => {
		const [type, data] = ddpMessage.fields.args;
		const [, ev] = ddpMessage.fields.eventName.split('/');
		if (/subscriptions/.test(ev)) {
			if (data.roles) {
				data.roles = data.roles.map(role => ({ value: role }));
			}
			if (data.blocker) {
				data.blocked = true;
			} else {
				data.blocked = false;
			}
			database.write(() => {
				database.create('subscriptions', data, true);
			});
		}
		if (/rooms/.test(ev) && type === 'updated') {
			const [sub] = database.objects('subscriptions').filtered('rid == $0', data._id);
			database.write(() => {
				sub.roomUpdatedAt = data._updatedAt;
				sub.lastMessage = normalizeMessage(data.lastMessage);
				sub.ro = data.ro;
				sub.description = data.description;
				sub.topic = data.topic;
				sub.announcement = data.announcement;
				sub.reactWhenReadOnly = data.reactWhenReadOnly;
				sub.archived = data.archived;
				sub.joinCodeRequired = data.joinCodeRequired;
			});
		}
	});
}

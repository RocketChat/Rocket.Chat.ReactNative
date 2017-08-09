import Meteor from 'react-native-meteor';
import Random from 'react-native-meteor/lib/Random';
import realm from './realm';

export { Accounts } from 'react-native-meteor';

const RocketChat = {
	get currentServer() {
		const current = realm.objects('servers').filtered('current = true')[0];
		return current && current.id;
	},

	set currentServer(server) {
		realm.write(() => {
			realm.objects('servers').filtered('current = true').forEach(item => (item.current = false));
			realm.create('servers', { id: server, current: true }, true);
		});
	}
};

export default RocketChat;

Meteor.Accounts.onLogin(() => {
	Meteor.call('subscriptions/get', (err, data) => {
		if (err) {
			console.error(err);
		}

		realm.write(() => {
			data.forEach((subscription) => {
				// const subscription = {
				// 	_id: item._id
				// };
				// if (typeof item.value === 'string') {
				// 	subscription.value = item.value;
				// }
				subscription._server = { id: RocketChat.currentServer };
				realm.create('subscriptions', subscription, true);
			});
		});
		Meteor.subscribe('stream-notify-user', `${ Meteor.userId() }/subscriptions-changed`, false);
	});
});

export function connect(cb) {
	const url = `${ RocketChat.currentServer }/websocket`;

	Meteor.connect(url);

	Meteor.ddp.on('connected', () => {
		console.log('connected');

		Meteor.call('public-settings/get', (err, data) => {
			if (err) {
				console.error(err);
			}

			realm.write(() => {
				data.forEach((item) => {
					const setting = {
						_id: item._id
					};
					setting._server = { id: RocketChat.currentServer };
					if (typeof item.value === 'string') {
						setting.value = item.value;
					}
					realm.create('settings', setting, true);
				});
			});

			cb();
		});

		Meteor.ddp.on('changed', (ddbMessage) => {
			console.log('changed', ddbMessage);
			if (ddbMessage.collection === 'stream-room-messages') {
				realm.write(() => {
					const message = ddbMessage.fields.args[0];
					message.temp = false;
					message._server = { id: RocketChat.currentServer };
					realm.create('messages', message, true);
				});
			}

			if (ddbMessage.collection === 'stream-notify-user') {
				realm.write(() => {
					const data = ddbMessage.fields.args[1];
					data._server = { id: RocketChat.currentServer };
					realm.create('subscriptions', data, true);
				});
			}
		});
	});
}

export function loginWithPassword(selector, password, cb) {
	Meteor.loginWithPassword(selector, password, () => cb && cb());
}

export function loadSubscriptions(cb) {
	Meteor.call('subscriptions/get', (err, data) => {
		if (err) {
			console.error(err);
		}

		realm.write(() => {
			data.forEach((subscription) => {
				// const subscription = {
				// 	_id: item._id
				// };
				// if (typeof item.value === 'string') {
				// 	subscription.value = item.value;
				// }
				subscription._server = { id: RocketChat.currentServer };
				realm.create('subscriptions', subscription, true);
			});
		});

		return cb && cb();
	});
}

export function loadMessagesForRoom(rid, cb) {
	Meteor.call('loadHistory', rid, null, 50, (err, data) => {
		if (err) {
			console.error(err);
		}

		realm.write(() => {
			data.messages.forEach((message) => {
				message.temp = false;
				message._server = { id: RocketChat.currentServer };
				realm.create('messages', message, true);
			});
		});

		if (cb) {
			cb();
		}
	});

	Meteor.subscribe('stream-room-messages', rid, false);
}

export function sendMessage(rid, msg) {
	const _id = Random.id();
	const user = Meteor.user();

	realm.write(() => {
		realm.create('messages', {
			_id,
			rid,
			msg,
			ts: new Date(),
			_updatedAt: new Date(),
			temp: true,
			_server: { id: RocketChat.currentServer },
			u: {
				_id: user._id,
				username: user.username
			}
		}, true);
	});

	return new Promise((resolve, reject) => {
		Meteor.call('sendMessage', { _id, rid, msg }, (error, result) => {
			if (error) {
				return reject(error);
			}
			return resolve(result);
		});
	});
}

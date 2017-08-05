import Meteor from 'react-native-meteor';
import realm from './realm';

export function connect(cb) {
	const currentServer = realm.objects('servers').filtered('current = true')[0];
	const url = `${ currentServer.id }/websocket`;

	console.log('CONNECTING TO', url);

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
					if (typeof item.value === 'string') {
						setting.value = item.value;
					}
					realm.create('settings', setting, true);
				});
			});

			cb();
		});
	});
}

export function loginWithPassword(selector, password, cb) {
	Meteor.loginWithPassword(selector, password, () => {
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
					realm.create('subscriptions', subscription, true);
				});
			});
		});
		cb();
	});
}

export function loadMessagesForRoom(rid) {
	Meteor.call('loadHistory', rid, null, 50, (err, data) => {
		if (err) {
			console.error(err);
		}
		console.log(data);

		realm.write(() => {
			data.messages.forEach((message) => {
				realm.create('messages', message, true);
			});
		});
	});
}

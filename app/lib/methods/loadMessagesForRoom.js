import { get } from './helpers/rest';
import database from '../realm';
import reduxStore from '../createStore';

import buildMessage from './helpers/buildMessage';

const loadMessagesForRoomRest = function(rid, end, cb) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	return get({ token, id, server }, 'channels.history', { rid, end }).messages;
};


const loadMessagesForRoomDDP = async function(rid, end, cb) {
	const data = await this.ddp.call('loadHistory', rid, end, 20);
	if (!data || !data.messages.length) {
		return [];
	}
	return data.messages;

	// }
	// 	if (cb) {
	// 		cb({ end: data && data.messages.length < 20 });
	// 	}
	// 	return data.message;
	// }, (err) => {
	// 	if (err) {
	// 		if (cb) {
	// 			cb({ end: true });
	// 		}
	// 		return Promise.reject(err);
	// 	}
	// });
};

export default async function(...args) {
 	const data = await (this.ddp._logged ? loadMessagesForRoomDDP.call(this, ...args) : loadMessagesForRoomRest.call(this, ...args).map(message => buildMessage(message)));
	database.write(() => {
		data.forEach((message) => {
			database.create('messages', message, true);
		});
	});
	return data;
}

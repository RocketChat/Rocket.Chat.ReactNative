import moment from 'moment';

import log from '../../utils/log';
import updateMessages from './updateMessages';

const COUNT = 50;

async function load({ rid: roomId, latest, t }) {
	let params = { roomId, count: COUNT };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}

	const apiType = this.roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	// RC 0.48.0
	const data = await this.sdk.get(`${ apiType }.history`, params);
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, args);
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const dummy = {
					_id: `dummy-${ lastMessage._id }`,
					rid: lastMessage.rid,
					ts: moment(lastMessage.ts).subtract(1, 'millisecond'), // TODO: can we do it without adding 1ms?
					t: 'dummy'
				};
				if (data.length === 50) {
					data.push(dummy);
				}
				await updateMessages({ rid: args.rid, update: data, item: args.item });
				return resolve(data);
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

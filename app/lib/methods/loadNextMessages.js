import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import updateMessages from './updateMessages';

const COUNT = 50;

export default function loadNextMessages(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await this.methodCallWrapper('loadNextMessages', args.rid, args.ts, COUNT);
			let messages = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');
			if (messages?.length) {
				const lastMessage = messages[messages.length - 1];
				const dummy = {
					_id: `dummy-${ lastMessage._id }`,
					rid: lastMessage.rid,
					ts: moment(lastMessage.ts).add(1, 'millisecond'), // TODO: can we do it without adding 1ms?
					t: 'dummy-next'
				};
				if (messages.length === COUNT) {
					messages.push(dummy);
				}
				await updateMessages({ rid: args.rid, update: messages, item: args.item });
				return resolve(messages);
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import updateMessages from './updateMessages';

const COUNT = 50;

export default function loadSurroundingMessages({ messageId, rid }) {
  console.log('🚀 ~ file: loadSurroundingMessages.js ~ line 7 ~ loadSurroundingMessages ~ messageId, rid', messageId, rid);
	return new Promise(async(resolve, reject) => {
		try {
			// TODO: not working through DDP
			const data = await this.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid }, COUNT);
			let messages = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');
			if (messages?.length) {
				if (data?.moreBefore) {
					const firstMessage = messages[0];
					const dummy = {
						_id: `dummy-${ firstMessage._id }`,
						rid: firstMessage.rid,
						ts: moment(firstMessage.ts).subtract(1, 'millisecond'), // TODO: can we do it without subtracting 1ms?
						t: 'dummy'
					};
					messages.unshift(dummy);
				}

				if (data?.moreAfter) {
					const lastMessage = messages[messages.length - 1];
					const dummy = {
						_id: `dummy-${ lastMessage._id }`,
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).add(1, 'millisecond'), // TODO: can we do it without adding 1ms?
						t: 'dummy-next'
					};
					messages.push(dummy);
				}
				await updateMessages({ rid, update: messages });
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

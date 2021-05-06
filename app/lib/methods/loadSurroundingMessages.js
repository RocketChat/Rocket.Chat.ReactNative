import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import updateMessages from './updateMessages';
import { getMessageById } from '../database/services/Message';
import { MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../constants/messageTypeLoad';

const COUNT = 50;

export default function loadSurroundingMessages({ messageId, rid }) {
  console.log('🚀 ~ file: loadSurroundingMessages.js ~ line 7 ~ loadSurroundingMessages ~ messageId, rid', messageId, rid);
	return new Promise(async(resolve, reject) => {
		try {
			// TODO: not working through DDP
			const data = await this.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid }, COUNT);
			let messages = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');

			const message = messages.find(m => m._id === messageId);
			const { tmid } = message;

			if (messages?.length) {
				if (data?.moreBefore) {
					const firstMessage = messages[0];
					const firstMessageRecord = await getMessageById(firstMessage._id);
					if (!firstMessageRecord) {
						const dummy = {
							_id: `dummy-${ firstMessage._id }`,
							rid: firstMessage.rid,
							tmid,
							ts: moment(firstMessage.ts).subtract(1, 'millisecond'), // TODO: can we do it without subtracting 1ms?
							t: MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK,
							msg: firstMessage.msg
						};
						messages.unshift(dummy);
					}
				}

				if (data?.moreAfter) {
					const lastMessage = messages[messages.length - 1];
					const lastMessageRecord = await getMessageById(lastMessage._id);
					if (!lastMessageRecord) {
						const dummy = {
							_id: `dummy-${ lastMessage._id }`,
							rid: lastMessage.rid,
							tmid,
							ts: moment(lastMessage.ts).add(1, 'millisecond'), // TODO: can we do it without adding 1ms?
							t: MESSAGE_TYPE_LOAD_NEXT_CHUNK,
							msg: lastMessage.msg
						};
						messages.push(dummy);
					}
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

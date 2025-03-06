import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants';
import sdk from '../services/sdk';
import { IMessage } from '../../definitions';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

export function loadSurroundingMessages({ messageId, rid }: { messageId: string; rid: string }) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await sdk.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid }, COUNT);
			let messages: IMessage[] = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');

			if (messages?.length) {
				if (data?.moreBefore) {
					const firstMessage = messages[0];
					const firstMessageRecord = await getMessageById(firstMessage._id);
					if (!firstMessageRecord) {
						const loadMoreItem = {
							_id: generateLoadMoreId(firstMessage._id),
							rid: firstMessage.rid,
							ts: moment(firstMessage.ts).subtract(1, 'millisecond').toDate(),
							t: MessageTypeLoad.PREVIOUS_CHUNK,
							msg: firstMessage.msg
						} as IMessage;
						messages.unshift(loadMoreItem);
					}
				}

				if (data?.moreAfter) {
					const lastMessage = messages[messages.length - 1];
					const lastMessageRecord = await getMessageById(lastMessage._id);
					if (!lastMessageRecord) {
						const loadMoreItem = {
							_id: generateLoadMoreId(lastMessage._id),
							rid: lastMessage.rid,
							ts: moment(lastMessage.ts).add(1, 'millisecond').toDate(),
							t: MessageTypeLoad.NEXT_CHUNK,
							msg: lastMessage.msg
						} as IMessage;
						messages.push(loadMoreItem);
					}
				}

				await updateMessages({ rid, update: messages });
				return resolve(messages);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import { MESSAGE_TYPE_LOAD_NEXT_CHUNK, MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK } from '../../constants/messageTypeLoad';
import { IRocketChat, IMessage } from '../../definitions';
import { generateLoadMoreId } from '../utils';
import updateMessages from './updateMessages';

const COUNT = 50;

interface ILoadMoreMessage {
	_id: string;
	rid: string;
	tmid?: string;
	ts: moment.Moment;
	t: string;
	msg?: string;
}

export default function loadSurroundingMessages(this: IRocketChat, { messageId, rid }: { messageId: string; rid: string }) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await this.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid }, COUNT);
			let messages: (IMessage | ILoadMoreMessage)[] = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');

			const message = messages.find(m => m._id === messageId);
			const tmid = message?.tmid;

			if (messages?.length) {
				if (data?.moreBefore) {
					const firstMessage = messages[0];
					const firstMessageRecord = await getMessageById(firstMessage._id);
					if (!firstMessageRecord) {
						const loadMoreItem = {
							_id: generateLoadMoreId(firstMessage._id || ''),
							rid: firstMessage.rid,
							tmid,
							ts: moment(firstMessage.ts).subtract(1, 'millisecond'),
							t: MESSAGE_TYPE_LOAD_PREVIOUS_CHUNK,
							msg: firstMessage.msg
						};
						messages.unshift(loadMoreItem);
					}
				}

				if (data?.moreAfter) {
					const lastMessage = messages[messages.length - 1];
					const lastMessageRecord = await getMessageById(lastMessage._id);
					if (!lastMessageRecord) {
						const loadMoreItem = {
							_id: generateLoadMoreId(lastMessage._id || ''),
							rid: lastMessage.rid,
							tmid,
							ts: moment(lastMessage.ts).add(1, 'millisecond'),
							t: MESSAGE_TYPE_LOAD_NEXT_CHUNK,
							msg: lastMessage.msg
						};
						messages.push(loadMoreItem);
					}
				}
				// TODO: Refactor when migrate methods/updateMessages
				// @ts-ignore
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

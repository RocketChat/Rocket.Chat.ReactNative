import orderBy from 'lodash/orderBy';

import dayjs from '../dayjs';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { type IMessage } from '~/definitions';
import updateMessages from './updateMessages';
import { getSurroundingMessages } from '../services/restApi';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

export async function loadSurroundingMessages({ messageId, rid }: { messageId: string; rid: string }): Promise<IMessage[]> {
	try {
		const { messages: fetched, moreBefore, moreAfter } = await getSurroundingMessages({ rid, messageId, count: COUNT });
		const messages = orderBy(fetched, 'ts');

		if (!messages.length) {
			return [];
		}

		if (moreBefore) {
			const firstMessage = messages[0];
			if (!(await getMessageById(firstMessage._id))) {
				messages.unshift({
					_id: generateLoadMoreId(firstMessage._id),
					rid: firstMessage.rid,
					ts: dayjs(firstMessage.ts).subtract(1, 'millisecond').toDate(),
					t: MessageTypeLoad.PREVIOUS_CHUNK,
					msg: firstMessage.msg
				} as IMessage);
			}
		}

		if (moreAfter) {
			const lastMessage = messages[messages.length - 1];
			if (!(await getMessageById(lastMessage._id))) {
				messages.push({
					_id: generateLoadMoreId(lastMessage._id),
					rid: lastMessage.rid,
					ts: dayjs(lastMessage.ts).add(1, 'millisecond').toDate(),
					t: MessageTypeLoad.NEXT_CHUNK,
					msg: lastMessage.msg
				} as IMessage);
			}
		}

		await updateMessages({ rid, update: messages });
		return messages;
	} catch (e) {
		log(e);
		throw e;
	}
}

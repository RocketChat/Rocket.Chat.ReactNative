import orderBy from 'lodash/orderBy';

import dayjs from '../dayjs';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants/messageTypeLoad';
import updateMessages from './updateMessages';
import { type IMessage, type TMessageModel } from '~/definitions';
import { getNextMessages } from '../services/restApi';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

interface ILoadNextMessages {
	rid: string;
	ts: Date;
	loaderItem: TMessageModel;
}

export function loadNextMessages(args: ILoadNextMessages): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const after = dayjs(args.ts).subtract(1, 'millisecond').toDate();
			const { messages: fetched, hasMore } = await getNextMessages({ rid: args.rid, after, count: COUNT });
			const messages = orderBy(fetched, 'ts');
			if (!messages.length) {
				await updateMessages({ rid: args.rid, update: [], remove: [{ _id: args.loaderItem.id }] });
				return resolve();
			}
			const lastMessage = messages[messages.length - 1];
			if (hasMore && !(await getMessageById(lastMessage._id))) {
				messages.push({
					_id: generateLoadMoreId(lastMessage._id),
					rid: lastMessage.rid,
					ts: dayjs(lastMessage.ts).add(1, 'millisecond').toDate(),
					t: MessageTypeLoad.NEXT_CHUNK
				} as IMessage);
			}
			await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
			return resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

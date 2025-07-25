import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../constants';
import updateMessages from './updateMessages';
import { TMessageModel } from '../../definitions';
import sdk from '../services/sdk';
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
			const data = await sdk.methodCallWrapper('loadNextMessages', args.rid, args.ts, COUNT);
			let messages = EJSON.fromJSONValue(data?.messages);
			messages = orderBy(messages, 'ts');
			if (messages?.length) {
				const lastMessage = messages[messages.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id);
				if (!lastMessageRecord && messages.length === COUNT) {
					const loadMoreItem = {
						_id: generateLoadMoreId(lastMessage._id),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).add(1, 'millisecond'),
						t: MessageTypeLoad.NEXT_CHUNK
					};
					messages.push(loadMoreItem);
				}
				await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
				return resolve();
			}
			return resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

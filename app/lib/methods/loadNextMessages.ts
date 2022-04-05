import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';
import { generateLoadMoreId } from '../utils';
import updateMessages from './updateMessages';
import { TMessageModel } from '../../definitions';
import sdk from '../rocketchat/services/sdk';

const COUNT = 50;

interface ILoadNextMessages {
	rid: string;
	ts: Date;
	tmid?: string;
	loaderItem: TMessageModel;
}

export default function loadNextMessages(args: ILoadNextMessages): Promise<void> {
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
						tmid: args.tmid,
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

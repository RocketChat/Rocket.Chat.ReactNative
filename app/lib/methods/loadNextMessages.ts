import EJSON from 'ejson';
import moment from 'moment';
import orderBy from 'lodash/orderBy';

import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import { MESSAGE_TYPE_LOAD_NEXT_CHUNK } from '../../constants/messageTypeLoad';
import { generateLoadMoreId } from '../utils';
import updateMessages from './updateMessages';
import { IMessage, TMessageModel } from '../../definitions';
import RocketChat from '../rocketchat';

const COUNT = 50;

interface ILoadNextMessages {
	rid: string;
	ts: string;
	tmid: string;
	loaderItem: TMessageModel;
}

export default function loadNextMessages(args: ILoadNextMessages): Promise<IMessage | []> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await RocketChat.methodCallWrapper('loadNextMessages', args.rid, args.ts, COUNT);
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
						t: MESSAGE_TYPE_LOAD_NEXT_CHUNK
					};
					messages.push(loadMoreItem);
				}
				await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
				return resolve(messages);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

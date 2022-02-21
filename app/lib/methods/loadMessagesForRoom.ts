import moment from 'moment';

import { MESSAGE_TYPE_LOAD_MORE } from '../../constants/messageTypeLoad';
import { ILoadMoreMessage, IMessageFromServer, TMessageModel } from '../../definitions';
import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import roomTypeToApiType, { RoomTypes } from '../rocketchat/methods/roomTypeToApiType';
import sdk from '../rocketchat/services/sdk';
import { generateLoadMoreId } from '../utils';
import updateMessages from './updateMessages';

const COUNT = 50;

async function load({ rid: roomId, latest, t }: { rid: string; latest?: string; t: RoomTypes }) {
	let params = { roomId, count: COUNT } as { roomId: string; count: number; latest?: string };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}

	const apiType = roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	// RC 0.48.0
	const data = await sdk.get(`${apiType}.history`, params);
	if (!data.success) {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest: string;
	loaderItem: TMessageModel;
}): Promise<(IMessageFromServer | ILoadMoreMessage)[]> {
	return new Promise(async (resolve, reject) => {
		try {
			const data: IMessageFromServer[] = await load(args);
			if (data?.length) {
				const loadMoreMessages: ILoadMoreMessage[] = [];
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id);
				if (!lastMessageRecord && data.length === COUNT) {
					const loadMoreMessage: ILoadMoreMessage = {
						_id: generateLoadMoreId(lastMessage._id),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).subtract(1, 'millisecond').toString(),
						t: MESSAGE_TYPE_LOAD_MORE,
						msg: lastMessage.msg
					};
					loadMoreMessages.push(loadMoreMessage);
				}
				// @ts-ignore
				await updateMessages({ rid: args.rid, update: [...data, ...loadMoreMessages], loaderItem: args.loaderItem });
				return resolve([...data, ...loadMoreMessages]);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

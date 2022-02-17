import moment from 'moment';

import { MESSAGE_TYPE_LOAD_MORE } from '../../constants/messageTypeLoad';
import log from '../../utils/log';
import { getMessageById } from '../database/services/Message';
import { generateLoadMoreId } from '../utils';
import updateMessages from './updateMessages';
import { IMessage, TMessageModel } from '../../definitions';
import sdk from '../rocketchat/services/sdk';
import roomTypeToApiType, { RoomTypes } from '../rocketchat/methods/roomTypeToApiType';

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
	// @ts-ignore
	const data: any = await sdk.get(`${apiType}.history`, params);
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest: string;
	loaderItem: TMessageModel;
}): Promise<IMessage[] | []> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await load(args);
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id);
				if (!lastMessageRecord && data.length === COUNT) {
					const loadMoreItem = {
						_id: generateLoadMoreId(lastMessage._id),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).subtract(1, 'millisecond'),
						t: MESSAGE_TYPE_LOAD_MORE,
						msg: lastMessage.msg
					};
					data.push(loadMoreItem);
				}
				await updateMessages({ rid: args.rid, update: data, loaderItem: args.loaderItem });
				return resolve(data);
			}
			return resolve([]);
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

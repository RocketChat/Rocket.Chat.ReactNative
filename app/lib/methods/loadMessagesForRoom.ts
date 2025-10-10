import moment from 'moment';

import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { IMessage, TMessageModel } from '../../definitions';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

interface HistoryParams {
	roomId: string;
	count: number;
	latest?: string;
}

async function load({ rid: roomId, latest, t }: { rid: string; latest?: Date; t: RoomTypes }): Promise<IMessage[]> {
	const apiType = roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	const allMessages: IMessage[] = [];
	let mainMessagesCount = 0;

	async function fetchBatch(lastTs?: string): Promise<void> {
		const params: HistoryParams = { roomId, count: COUNT };
		if (lastTs) {
			params.latest = lastTs;
		}

		const data = await sdk.get(`${apiType}.history`, params);

		if (!data?.success || !data.messages?.length) {
			return;
		}

		const batch = data.messages as IMessage[];
		allMessages.push(...batch);

		const mainMessagesInBatch = batch.filter(message => !message.tmid);
		mainMessagesCount += mainMessagesInBatch.length;

		const needsMoreMainMessages = mainMessagesCount < COUNT;
		const hasMoreMessages = batch.length === COUNT;

		if (needsMoreMainMessages && hasMoreMessages) {
			const lastMessage = batch[batch.length - 1];
			return fetchBatch(lastMessage.ts as string);
		}
	}

	const startTimestamp = latest ? new Date(latest).toISOString() : undefined;
	await fetchBatch(startTimestamp);

	return allMessages;
}

export function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
}): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await load(args);
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id as string);
				if (!lastMessageRecord && data.length === COUNT) {
					const loadMoreMessage = {
						_id: generateLoadMoreId(lastMessage._id as string),
						rid: lastMessage.rid,
						ts: moment(lastMessage.ts).subtract(1, 'millisecond').toString(),
						t: MessageTypeLoad.MORE,
						msg: lastMessage.msg
					} as IMessage;
					data.push(loadMoreMessage);
				}
				await updateMessages({ rid: args.rid, update: data, loaderItem: args.loaderItem });
				return resolve();
			}
			return resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}

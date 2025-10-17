import moment from 'moment';

import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { type IMessage, type TMessageModel } from '../../definitions';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { type RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;

async function load({ rid: roomId, latest, t }: { rid: string; latest?: Date; t: RoomTypes }): Promise<IMessage[]> {
	const apiType = roomTypeToApiType(t);
	if (!apiType) {
		return [];
	}

	const allMessages: IMessage[] = [];
	let mainMessagesCount = 0;

	async function fetchBatch(lastTs?: string): Promise<void> {
		if (allMessages.length >= COUNT * 10) {
			return;
		}

		const params = { roomId, count: COUNT, ...(lastTs && { latest: lastTs }) };

		let data;
		switch (apiType) {
			case 'channels':
				data = await sdk.get('channels.history', params);
				break;
			case 'groups':
				data = await sdk.get('groups.history', params);
				break;
			case 'im':
				data = await sdk.get('im.history', params);
				break;
			default:
				return;
		}

		if (!data?.success || !data.messages?.length) {
			return;
		}

		const batch = data.messages as IMessage[];
		allMessages.push(...batch);

		const mainMessagesInBatch = batch.filter(message => !message.tmid);
		mainMessagesCount += mainMessagesInBatch.length;

		const needsMoreMainMessages = mainMessagesCount < COUNT;

		if (needsMoreMainMessages) {
			const lastMessage = batch[batch.length - 1];
			await fetchBatch(lastMessage.ts as string);
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
				if (!lastMessageRecord && (data.length === COUNT || data.length >= COUNT * 10)) {
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

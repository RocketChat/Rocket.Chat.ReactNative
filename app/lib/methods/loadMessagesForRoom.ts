import dayjs from '../dayjs';
import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { type IMessage, type TMessageModel } from '../../definitions';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { type RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';

const COUNT = 50;
const MAX_BATCHES = 10;

const isVisibleMainRoomMessage = (message: IMessage, hideSystemMessages: string[]) =>
	!message.tmid && (!message.t || !hideSystemMessages.includes(message.t));

async function resolveHideSystemMessages(rid: string): Promise<string[]> {
	const sub = await getSubscriptionByRoomId(rid);
	if (Array.isArray(sub?.sysMes)) {
		return sub.sysMes;
	}
	const fromSettings = store.getState().settings.Hide_System_Messages;
	return Array.isArray(fromSettings) ? fromSettings : [];
}

async function load({
	rid: roomId,
	latest,
	t
}: {
	rid: string;
	latest?: Date;
	t: RoomTypes;
}): Promise<{ messages: IMessage[]; shouldAddLoader: boolean }> {
	const hideSystemMessages = await resolveHideSystemMessages(roomId);
	const apiType = roomTypeToApiType(t);
	if (!apiType) {
		return { messages: [], shouldAddLoader: false };
	}

	const allMessages: IMessage[] = [];
	let visibleMainMessagesCount = 0;
	let batchesFetched = 0;
	let shouldAddLoader = false;

	async function fetchBatch(lastTs?: string): Promise<void> {
		if (visibleMainMessagesCount >= COUNT || batchesFetched >= MAX_BATCHES) {
			return;
		}
		batchesFetched += 1;

		const params = { roomId, showThreadMessages: false, count: COUNT, ...(lastTs && { latest: lastTs }) };

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
		shouldAddLoader = batch.length === COUNT;

		const visibleMainMessagesInBatch = batch.filter(message => isVisibleMainRoomMessage(message, hideSystemMessages));
		visibleMainMessagesCount += visibleMainMessagesInBatch.length;

		const needsMoreVisibleMainMessages = visibleMainMessagesCount < COUNT && batch.length === COUNT;

		if (needsMoreVisibleMainMessages) {
			const lastMessage = batch[batch.length - 1];
			await fetchBatch(lastMessage.ts as string);
		}
	}

	const startTimestamp = latest ? new Date(latest).toISOString() : undefined;
	await fetchBatch(startTimestamp);
	return { messages: allMessages, shouldAddLoader };
}

export function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
}): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { messages, shouldAddLoader } = await load(args);
			const data = messages;
			if (data?.length) {
				const lastMessage = data[data.length - 1];
				const lastMessageRecord = await getMessageById(lastMessage._id as string);
				if (!lastMessageRecord && shouldAddLoader) {
					const loadMoreMessage = {
						_id: generateLoadMoreId(lastMessage._id as string),
						rid: lastMessage.rid,
						ts: dayjs(lastMessage.ts).subtract(1, 'millisecond').toString(),
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

import dayjs from '../dayjs';
import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { roomHistoryUiLoaderPop, roomHistoryUiLoaderPush } from '../../actions/room';
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

async function load(args: {
	rid: string;
	latest?: Date;
	t: RoomTypes;
	loaderItem?: TMessageModel;
}): Promise<{ messages: IMessage[]; shouldAddLoader: boolean; uiLoaderId: string | null }> {
	const roomId = args.rid;
	const hideSystemMessages = await resolveHideSystemMessages(roomId);
	const apiType = roomTypeToApiType(args.t);
	if (!apiType) {
		return { messages: [], shouldAddLoader: false, uiLoaderId: null };
	}

	const allMessages: IMessage[] = [];
	let visibleMainMessagesCount = 0;
	let batchesFetched = 0;
	let shouldAddLoader = false;
	let uiLoaderId: string | null = null;

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

			if (!args.loaderItem && batchesFetched === 1) {
				const loadMoreMessage = {
					_id: generateLoadMoreId(lastMessage._id as string),
					rid: lastMessage.rid,
					ts: dayjs(lastMessage.ts).subtract(1, 'millisecond').toString(),
					t: MessageTypeLoad.MORE,
					msg: lastMessage.msg
				} as IMessage;

				await updateMessages({
					rid: roomId,
					update: [...allMessages, loadMoreMessage],
					loaderItem: args.loaderItem
				});
				store.dispatch(roomHistoryUiLoaderPush({ loaderId: loadMoreMessage._id }));
				uiLoaderId = loadMoreMessage._id;
			}

			await fetchBatch(lastMessage.ts as string);
		}
	}

	const startTimestamp = args.latest ? new Date(args.latest).toISOString() : undefined;
	try {
		await fetchBatch(startTimestamp);
		return { messages: allMessages, shouldAddLoader, uiLoaderId };
	} catch (e) {
		if (uiLoaderId) {
			store.dispatch(roomHistoryUiLoaderPop({ loaderId: uiLoaderId }));
		}
		throw e;
	}
}

export function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
}): Promise<void> {
	return new Promise(async (resolve, reject) => {
		let uiLoaderId: string | null = null;
		try {
			const { messages, shouldAddLoader, uiLoaderId: pushedLoaderId } = await load(args);
			uiLoaderId = pushedLoaderId;
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
		} finally {
			if (uiLoaderId) {
				store.dispatch(roomHistoryUiLoaderPop({ loaderId: uiLoaderId }));
			}
		}
	});
}

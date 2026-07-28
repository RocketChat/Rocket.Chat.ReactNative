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
import { snapshotServerTimestamps, type TServerTimestamps, updateLastOpen } from './updateLastOpen';

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
	onUiLoaderPushed?: (loaderId: string) => void;
}): Promise<{ messages: IMessage[]; serverTimestamps: TServerTimestamps; lastBatchWasFull: boolean }> {
	const roomId = args.rid;
	const hideSystemMessages = await resolveHideSystemMessages(roomId);
	const apiType = roomTypeToApiType(args.t);
	if (!apiType) {
		return { messages: [], serverTimestamps: [], lastBatchWasFull: false };
	}

	const allMessages: IMessage[] = [];
	const serverTimestamps: TServerTimestamps = [];
	let visibleMainMessagesCount = 0;
	let batchesFetched = 0;
	let lastBatchWasFull = false;

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
		serverTimestamps.push(...snapshotServerTimestamps(batch));
		allMessages.push(...batch);
		lastBatchWasFull = batch.length === COUNT;

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
				args.onUiLoaderPushed?.(loadMoreMessage._id);
			}

			await fetchBatch(lastMessage.ts as string);
		}
	}

	const startTimestamp = args.latest ? new Date(args.latest).toISOString() : undefined;
	await fetchBatch(startTimestamp);
	return { messages: allMessages, serverTimestamps, lastBatchWasFull };
}

export async function loadMessagesForRoom(args: {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
}): Promise<void> {
	let uiLoaderId: string | null = null;
	try {
		const { messages, serverTimestamps, lastBatchWasFull } = await load({
			...args,
			onUiLoaderPushed: id => {
				uiLoaderId = id;
			}
		});
		if (messages?.length) {
			const lastMessage = messages[messages.length - 1];
			const lastMessageRecord = await getMessageById(lastMessage._id as string);
			if (!lastMessageRecord && lastBatchWasFull) {
				messages.push({
					_id: generateLoadMoreId(lastMessage._id as string),
					rid: lastMessage.rid,
					ts: dayjs(lastMessage.ts).subtract(1, 'millisecond').toString(),
					t: MessageTypeLoad.MORE,
					msg: lastMessage.msg
				} as IMessage);
			}
			await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
		}

		// Only the initial tail load reaches the newest history, so only it can state how far
		// the room is synced. Older pages (`latest`) and gap fills (`loaderItem`) must not.
		if (!args.latest && !args.loaderItem) {
			await updateLastOpen(args.rid, serverTimestamps);
		}
	} catch (e) {
		log(e);
		throw e;
	} finally {
		if (uiLoaderId) {
			store.dispatch(roomHistoryUiLoaderPop({ loaderId: uiLoaderId }));
		}
	}
}

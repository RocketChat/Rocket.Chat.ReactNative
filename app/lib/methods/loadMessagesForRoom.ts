import dayjs from '../dayjs';
import { MessageTypeLoad } from '../constants/messageTypeLoad';
import { roomHistoryUiLoaderPop, roomHistoryUiLoaderPush } from '~/actions/room';
import { type IMessage, type TMessageModel } from '~/definitions/IMessage';
import log from './helpers/log';
import { getMessageById } from '../database/services/Message';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { type RoomTypes, roomTypeToApiType } from './roomTypeToApiType';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import updateMessages from './updateMessages';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';
import { getHiddenSystemMessages } from './helpers/getHiddenSystemMessages';
import { snapshotServerTimestamps, type TServerTimestamps, updateLastOpen } from './updateLastOpen';

const COUNT = 50;
const MAX_BATCHES = 10;

const isVisibleMainRoomMessage = (message: IMessage, hideSystemMessages: string[]) =>
	!message.tmid && (!message.t || !hideSystemMessages.includes(message.t));

const buildOlderLoader = (oldestMessage: IMessage): IMessage =>
	({
		_id: generateLoadMoreId(oldestMessage._id as string),
		rid: oldestMessage.rid,
		ts: dayjs(oldestMessage.ts).subtract(1, 'millisecond').toDate(),
		t: MessageTypeLoad.MORE,
		msg: oldestMessage.msg
	}) as IMessage;

async function resolveHideSystemMessages(rid: string): Promise<string[]> {
	const sub = await getSubscriptionByRoomId(rid);
	return getHiddenSystemMessages(sub?.sysMes, store.getState().settings.Hide_System_Messages);
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

		if (!data?.success) {
			return;
		}

		const batch = (data.messages ?? []) as IMessage[];
		lastBatchWasFull = batch.length === COUNT;
		if (!batch.length) {
			return;
		}
		serverTimestamps.push(...snapshotServerTimestamps(batch));
		allMessages.push(...batch);

		const visibleMainMessagesInBatch = batch.filter(message => isVisibleMainRoomMessage(message, hideSystemMessages));
		visibleMainMessagesCount += visibleMainMessagesInBatch.length;

		const needsMoreVisibleMainMessages = visibleMainMessagesCount < COUNT && batch.length === COUNT;

		if (needsMoreVisibleMainMessages) {
			const lastMessage = batch[batch.length - 1];

			if (!args.loaderItem && batchesFetched === 1) {
				const loadMoreMessage = buildOlderLoader(lastMessage);

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

const hasGapBelow = async (oldestMessage: IMessage): Promise<boolean> => {
	if (!(await getMessageById(oldestMessage._id as string))) {
		return true;
	}
	const olderLoaderRecord = await getMessageById(generateLoadMoreId(oldestMessage._id as string));
	return olderLoaderRecord?.t === MessageTypeLoad.MORE;
};

type TLoadMessagesForRoomArgs = {
	rid: string;
	t: RoomTypes;
	latest?: Date;
	loaderItem?: TMessageModel;
};

const liveTailLoads = new Map<string, Promise<void>>();

const isLiveTailLoad = (args: TLoadMessagesForRoomArgs): boolean => !args.latest && !args.loaderItem;

export const waitForLiveTailLoad = (rid: string): Promise<void> => liveTailLoads.get(rid) ?? Promise.resolve();

export function loadMessagesForRoom(args: TLoadMessagesForRoomArgs): Promise<void> {
	const currentLoad = loadRoomHistory(args);
	if (isLiveTailLoad(args)) {
		liveTailLoads.set(
			args.rid,
			currentLoad.catch(() => undefined)
		);
	}
	return currentLoad;
}

async function loadRoomHistory(args: TLoadMessagesForRoomArgs): Promise<void> {
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
			if (lastBatchWasFull && (await hasGapBelow(lastMessage))) {
				messages.push(buildOlderLoader(lastMessage));
			}
			await updateMessages({ rid: args.rid, update: messages, loaderItem: args.loaderItem });
		}

		if (isLiveTailLoad(args)) {
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

import { loadNextMessages } from './loadNextMessages';
import sdk from '../services/sdk';
import { getMessageById } from '../database/services/Message';
import updateMessages from './updateMessages';
import log from './helpers/log';
import dayjs from '../dayjs';
import { MessageTypeLoad } from '../constants/messageTypeLoad';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: { methodCallWrapper: jest.fn() }
}));

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('./updateMessages', () => jest.fn());

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('ejson', () => ({
	__esModule: true,
	default: { fromJSONValue: (value: any) => value }
}));

const mockedMethodCall = sdk.methodCallWrapper as jest.MockedFunction<typeof sdk.methodCallWrapper>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedLog = log as jest.MockedFunction<typeof log>;

const RID = 'ROOM_ID';
const TS = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
const COUNT = 50;
const LOADER_ITEM = { id: 'tapped-loader' } as any;

const buildMessage = (id: string, ts: Date) => ({ _id: id, rid: RID, ts, msg: `msg-${id}` }) as any;

const buildPage = (length: number, baseMs = Date.UTC(2024, 0, 1, 12, 0, 0)) =>
	Array.from({ length }, (_, index) => buildMessage(`msg-${index + 1}`, new Date(baseMs + (index + 1) * 1000)));

describe('loadNextMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null as never);
		mockedUpdateMessages.mockResolvedValue(0 as never);
	});

	it('resolves without delegating when the server returns no messages', async () => {
		mockedMethodCall.mockResolvedValue({ messages: [] } as never);

		await expect(loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM })).resolves.toBeUndefined();

		expect(mockedMethodCall).toHaveBeenCalledWith('loadNextMessages', RID, TS, COUNT);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
		expect(mockedGetMessageById).not.toHaveBeenCalled();
	});

	it('delegates a partial page with no marker', async () => {
		const messages = buildPage(10);

		mockedMethodCall.mockResolvedValue({ messages } as never);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: messages, loaderItem: LOADER_ITEM });
	});

	it('appends a load_next_chunk marker on a full page when the last message is not local', async () => {
		const messages = buildPage(COUNT);

		mockedMethodCall.mockResolvedValue({ messages } as never);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		const lastMessage = messages[messages.length - 1];
		expect(mockedGetMessageById).toHaveBeenCalledWith(lastMessage._id);
		const update = mockedUpdateMessages.mock.calls[0][0].update as any[];
		expect(update).toHaveLength(COUNT + 1);
		const marker = update[update.length - 1];
		expect(marker._id).toBe(`load-more-${lastMessage._id}`);
		expect(marker.rid).toBe(lastMessage.rid);
		expect(marker.t).toBe(MessageTypeLoad.NEXT_CHUNK);
		expect(dayjs(marker.ts).valueOf()).toBe(dayjs(lastMessage.ts).add(1, 'millisecond').valueOf());
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update, loaderItem: LOADER_ITEM });
	});

	it('adds no marker on a full page when the last message is already local', async () => {
		const messages = buildPage(COUNT);
		mockedMethodCall.mockResolvedValue({ messages } as never);
		mockedGetMessageById.mockResolvedValue({ id: messages[messages.length - 1]._id } as never);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		const update = mockedUpdateMessages.mock.calls[0][0].update as any[];
		expect(update).toHaveLength(COUNT);
		expect(update.find(m => m.t === MessageTypeLoad.NEXT_CHUNK)).toBeUndefined();
	});

	it('orders decoded messages by ts ascending before picking the last message', async () => {
		const ordered = buildPage(COUNT);
		const unordered = [...ordered].reverse();
		mockedMethodCall.mockResolvedValue({ messages: unordered } as never);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		const lastMessage = ordered[ordered.length - 1];
		expect(mockedGetMessageById).toHaveBeenCalledWith(lastMessage._id);
		const update = mockedUpdateMessages.mock.calls[0][0].update as any[];
		expect(update.slice(0, COUNT).map(m => m._id)).toEqual(ordered.map(m => m._id));
		const marker = update[update.length - 1];
		expect(marker._id).toBe(`load-more-${lastMessage._id}`);
		expect(dayjs(marker.ts).valueOf()).toBe(dayjs(lastMessage.ts).add(1, 'millisecond').valueOf());
	});

	it('logs and rejects with the same error when the SDK call fails', async () => {
		const error = new Error('boom');
		mockedMethodCall.mockRejectedValue(error);

		await expect(loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM })).rejects.toBe(error);

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});
});

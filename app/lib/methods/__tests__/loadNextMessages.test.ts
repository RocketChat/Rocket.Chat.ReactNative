import { loadNextMessages } from '../loadNextMessages';
import { getNextMessages } from '../../services/restApi';
import { getMessageById } from '../../database/services/Message';
import updateMessages from '../updateMessages';
import log from '../helpers/log';
import dayjs from '../../dayjs';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';

jest.mock('../../services/restApi', () => ({
	getNextMessages: jest.fn()
}));

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../updateMessages', () => jest.fn());

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedGetNextMessages = getNextMessages as jest.MockedFunction<typeof getNextMessages>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedLog = log as jest.MockedFunction<typeof log>;

const RID = 'ROOM_ID';
const TS = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
const COUNT = 50;
const LOADER_ITEM = { id: 'tapped-loader' } as any;
const NEWEST_MS = TS.getTime() + COUNT * 1000;

const buildMessages = (length: number) =>
	Array.from(
		{ length },
		(_, index) => ({ _id: `msg-${index + 1}`, rid: RID, ts: new Date(TS.getTime() + (index + 1) * 1000) }) as any
	);

const serve = (messages: any[], hasMore: boolean) => mockedGetNextMessages.mockResolvedValue({ messages, hasMore });

describe('loadNextMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null as never);
		mockedUpdateMessages.mockResolvedValue(0 as never);
	});

	it('asks for the messages after the last loaded message, one millisecond before the loader', async () => {
		serve([], false);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		expect(mockedGetNextMessages).toHaveBeenCalledWith({ rid: RID, after: new Date(TS.getTime() - 1), count: COUNT });
	});

	it('removes the Newer Loader when the server returns nothing newer', async () => {
		serve([], false);

		await expect(loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM })).resolves.toBeUndefined();

		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: [], remove: [{ _id: 'tapped-loader' }] });
	});

	it('delegates a full response without adding a Newer Loader when the server reports nothing newer', async () => {
		const messages = buildMessages(COUNT);
		serve(messages, false);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		expect(mockedGetMessageById).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: messages, loaderItem: LOADER_ITEM });
	});

	it('adds no Newer Loader when more exist but the newest message is already local', async () => {
		const messages = buildMessages(COUNT);
		serve(messages, true);
		mockedGetMessageById.mockResolvedValue({ id: 'msg-50' } as never);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: messages, loaderItem: LOADER_ITEM });
	});

	it('appends a Newer Loader one millisecond after the newest message when more exist and it is not local', async () => {
		const messages = buildMessages(COUNT);
		serve(messages, true);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		expect(mockedGetMessageById).toHaveBeenCalledWith('msg-50');
		const update = mockedUpdateMessages.mock.calls[0][0].update as any[];
		expect(update).toHaveLength(COUNT + 1);
		expect(update.slice(0, COUNT)).toEqual(messages);
		const loaderRow = update[COUNT];
		expect(loaderRow._id).toBe('load-more-msg-50');
		expect(loaderRow.rid).toBe(RID);
		expect(loaderRow.t).toBe(MessageTypeLoad.NEXT_CHUNK);
		expect(dayjs(loaderRow.ts).valueOf()).toBe(NEWEST_MS + 1);
	});

	it('stores a newest-first response oldest-first', async () => {
		const newestFirst = buildMessages(COUNT)
			.reverse()
			.map(message => ({ ...message, ts: message.ts.toISOString() }));
		serve(newestFirst, false);

		await loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM });

		const update = mockedUpdateMessages.mock.calls[0][0].update as any[];
		expect(update.map(m => m._id)).toEqual(buildMessages(COUNT).map(m => m._id));
	});

	it('logs and rejects with the same error when loading fails', async () => {
		const error = new Error('boom');
		mockedGetNextMessages.mockRejectedValue(error);

		await expect(loadNextMessages({ rid: RID, ts: TS, loaderItem: LOADER_ITEM })).rejects.toBe(error);

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});
});

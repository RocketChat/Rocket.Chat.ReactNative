import { loadSurroundingMessages } from '../loadSurroundingMessages';
import { getSurroundingMessages } from '../../services/restApi';
import { getMessageById } from '../../database/services/Message';
import updateMessages from '../updateMessages';
import log from '../helpers/log';
import dayjs from '../../dayjs';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';

jest.mock('../../services/restApi', () => ({
	getSurroundingMessages: jest.fn()
}));

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../updateMessages', () => jest.fn());

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedGetSurroundingMessages = getSurroundingMessages as jest.MockedFunction<typeof getSurroundingMessages>;
const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedLog = log as jest.MockedFunction<typeof log>;

const RID = 'ROOM_ID';
const MESSAGE_ID = 'MESSAGE_ID';
const COUNT = 50;

const buildMessage = (id: string, seconds: number) =>
	({ _id: id, rid: RID, ts: new Date(Date.UTC(2024, 0, 1, 12, 0, seconds)), msg: `msg-${id}` }) as any;

const buildMessages = () => [buildMessage('msg-1', 1), buildMessage('msg-2', 2), buildMessage('msg-3', 3)];

const serve = (messages: any[], moreBefore: boolean, moreAfter: boolean) =>
	mockedGetSurroundingMessages.mockResolvedValue({ messages, moreBefore, moreAfter });

describe('loadSurroundingMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null as never);
		mockedUpdateMessages.mockResolvedValue(0 as never);
	});

	it('asks for the window around the message', async () => {
		serve([], false, false);

		await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(mockedGetSurroundingMessages).toHaveBeenCalledWith({ rid: RID, messageId: MESSAGE_ID, count: COUNT });
	});

	it('resolves [] without delegating when the server returns no messages', async () => {
		serve([], false, false);

		await expect(loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })).resolves.toEqual([]);

		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});

	it('delegates with no markers when moreBefore and moreAfter are both false', async () => {
		const messages = buildMessages();
		serve(messages, false, false);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(result).toEqual(messages);
		expect(mockedGetMessageById).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: messages });
		expect(mockedUpdateMessages.mock.calls[0][0]).not.toHaveProperty('loaderItem');
	});

	it('prepends an Older Loader when moreBefore is true and the first message is not local', async () => {
		const messages = buildMessages();
		serve(messages, true, false);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		const firstMessage = messages[0];
		expect(mockedGetMessageById).toHaveBeenCalledWith(firstMessage._id);
		expect(result).toHaveLength(messages.length + 1);
		const marker = result[0];
		expect(marker._id).toBe(`load-more-${firstMessage._id}`);
		expect(marker.rid).toBe(firstMessage.rid);
		expect(marker.t).toBe(MessageTypeLoad.PREVIOUS_CHUNK);
		expect(marker.msg).toBe(firstMessage.msg);
		expect(dayjs(marker.ts).valueOf()).toBe(dayjs(firstMessage.ts).subtract(1, 'millisecond').valueOf());
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: result });
	});

	it('prepends no Older Loader when moreBefore is true but the first message is already local', async () => {
		const messages = buildMessages();
		serve(messages, true, false);
		mockedGetMessageById.mockResolvedValue({ id: messages[0]._id } as never);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(result).toHaveLength(messages.length);
		expect(result.find(m => m.t === MessageTypeLoad.PREVIOUS_CHUNK)).toBeUndefined();
	});

	it('appends a Newer Loader when moreAfter is true and the last message is not local', async () => {
		const messages = buildMessages();
		serve(messages, false, true);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		const lastMessage = messages[messages.length - 1];
		expect(mockedGetMessageById).toHaveBeenCalledWith(lastMessage._id);
		expect(result).toHaveLength(messages.length + 1);
		const marker = result[result.length - 1];
		expect(marker._id).toBe(`load-more-${lastMessage._id}`);
		expect(marker.rid).toBe(lastMessage.rid);
		expect(marker.t).toBe(MessageTypeLoad.NEXT_CHUNK);
		expect(marker.msg).toBe(lastMessage.msg);
		expect(dayjs(marker.ts).valueOf()).toBe(dayjs(lastMessage.ts).add(1, 'millisecond').valueOf());
	});

	it('appends no Newer Loader when moreAfter is true but the last message is already local', async () => {
		const messages = buildMessages();
		serve(messages, false, true);
		mockedGetMessageById.mockResolvedValue({ id: messages[messages.length - 1]._id } as never);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(result).toHaveLength(messages.length);
		expect(result.find(m => m.t === MessageTypeLoad.NEXT_CHUNK)).toBeUndefined();
	});

	it('adds both Loader Rows when moreBefore and moreAfter are true and neither endpoint is local', async () => {
		const messages = buildMessages();
		serve(messages, true, true);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(result).toHaveLength(messages.length + 2);
		expect(result[0].t).toBe(MessageTypeLoad.PREVIOUS_CHUNK);
		expect(result[0]._id).toBe(`load-more-${messages[0]._id}`);
		expect(result[result.length - 1].t).toBe(MessageTypeLoad.NEXT_CHUNK);
		expect(result[result.length - 1]._id).toBe(`load-more-${messages[messages.length - 1]._id}`);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: result });
	});

	it('orders a newest-first response by ts ascending before selecting the endpoints', async () => {
		const ordered = buildMessages();
		const newestFirst = [...ordered].reverse().map(message => ({ ...message, ts: message.ts.toISOString() }));
		serve(newestFirst, true, true);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(mockedGetMessageById).toHaveBeenCalledWith(ordered[0]._id);
		expect(mockedGetMessageById).toHaveBeenCalledWith(ordered[ordered.length - 1]._id);
		expect(result.slice(1, -1).map(m => m._id)).toEqual(ordered.map(m => m._id));
		expect(result[0]._id).toBe(`load-more-${ordered[0]._id}`);
		expect(result[result.length - 1]._id).toBe(`load-more-${ordered[ordered.length - 1]._id}`);
		expect(dayjs(result[0].ts).valueOf()).toBe(dayjs(ordered[0].ts).subtract(1, 'millisecond').valueOf());
		expect(dayjs(result[result.length - 1].ts).valueOf()).toBe(
			dayjs(ordered[ordered.length - 1].ts)
				.add(1, 'millisecond')
				.valueOf()
		);
	});

	it('logs and rejects with the same error when loading fails', async () => {
		const error = new Error('boom');
		mockedGetSurroundingMessages.mockRejectedValue(error);

		await expect(loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })).rejects.toBe(error);

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});
});

import { loadSurroundingMessages } from './loadSurroundingMessages';
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
const MESSAGE_ID = 'MESSAGE_ID';
const COUNT = 50;

const buildMessage = (id: string, seconds: number) =>
	({ _id: id, rid: RID, ts: new Date(Date.UTC(2024, 0, 1, 12, 0, seconds)), msg: `msg-${id}` }) as any;

const buildMessages = () => [buildMessage('msg-1', 1), buildMessage('msg-2', 2), buildMessage('msg-3', 3)];

describe('loadSurroundingMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null as never);
		mockedUpdateMessages.mockResolvedValue(0 as never);
	});

	it('resolves [] without delegating when the server returns no messages', async () => {
		mockedMethodCall.mockResolvedValue({ messages: [] } as never);

		await expect(loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })).resolves.toEqual([]);

		expect(mockedMethodCall).toHaveBeenCalledWith('loadSurroundingMessages', { _id: MESSAGE_ID, rid: RID }, COUNT);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});

	it('delegates with no markers when moreBefore and moreAfter are both falsy', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: false, moreAfter: false } as never);

		const result = await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID });

		expect(result).toEqual(messages);
		expect(mockedGetMessageById).not.toHaveBeenCalled();
		expect(mockedUpdateMessages).toHaveBeenCalledTimes(1);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: messages });
		expect(mockedUpdateMessages.mock.calls[0][0]).not.toHaveProperty('loaderItem');
	});

	it('prepends a load_previous_chunk marker when moreBefore is true and the first message is not local', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: true, moreAfter: false } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

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

	it('prepends no marker when moreBefore is true but the first message is already local', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: true, moreAfter: false } as never);
		mockedGetMessageById.mockResolvedValue({ id: messages[0]._id } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

		expect(result).toHaveLength(messages.length);
		expect(result.find(m => m.t === MessageTypeLoad.PREVIOUS_CHUNK)).toBeUndefined();
	});

	it('appends a load_next_chunk marker when moreAfter is true and the last message is not local', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: false, moreAfter: true } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

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

	it('appends no marker when moreAfter is true but the last message is already local', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: false, moreAfter: true } as never);
		mockedGetMessageById.mockResolvedValue({ id: messages[messages.length - 1]._id } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

		expect(result).toHaveLength(messages.length);
		expect(result.find(m => m.t === MessageTypeLoad.NEXT_CHUNK)).toBeUndefined();
	});

	it('adds both markers when moreBefore and moreAfter are true and neither endpoint is local', async () => {
		const messages = buildMessages();
		mockedMethodCall.mockResolvedValue({ messages, moreBefore: true, moreAfter: true } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

		expect(result).toHaveLength(messages.length + 2);
		expect(result[0].t).toBe(MessageTypeLoad.PREVIOUS_CHUNK);
		expect(result[0]._id).toBe(`load-more-${messages[0]._id}`);
		expect(result[result.length - 1].t).toBe(MessageTypeLoad.NEXT_CHUNK);
		expect(result[result.length - 1]._id).toBe(`load-more-${messages[messages.length - 1]._id}`);
		expect(mockedUpdateMessages).toHaveBeenCalledWith({ rid: RID, update: result });
	});

	it('orders decoded messages by ts ascending before selecting the endpoints', async () => {
		const ordered = buildMessages();
		const unordered = [...ordered].reverse();
		mockedMethodCall.mockResolvedValue({ messages: unordered, moreBefore: true, moreAfter: true } as never);

		const result = (await loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })) as any[];

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

	it('logs and rejects with the same error when the SDK call fails', async () => {
		const error = new Error('boom');
		mockedMethodCall.mockRejectedValue(error);

		await expect(loadSurroundingMessages({ messageId: MESSAGE_ID, rid: RID })).rejects.toBe(error);

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(mockedUpdateMessages).not.toHaveBeenCalled();
	});
});

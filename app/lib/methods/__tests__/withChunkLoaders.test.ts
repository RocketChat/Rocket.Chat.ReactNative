import { withChunkLoaders } from '../withChunkLoaders';
import { getMessageById } from '../../database/services/Message';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

const mockedGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>;

const RID = 'ROOM_ID';

const buildMessage = (id: string, seconds: number) =>
	({ _id: id, rid: RID, ts: new Date(Date.UTC(2024, 0, 1, 12, 0, seconds)), msg: `msg-${id}` }) as any;

const buildMessages = () => [buildMessage('msg-1', 1), buildMessage('msg-2', 2), buildMessage('msg-3', 3)];

describe('withChunkLoaders', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessageById.mockResolvedValue(null as never);
	});

	it('returns an empty Chunk untouched without looking anything up', async () => {
		await expect(withChunkLoaders([], { moreBefore: true, moreAfter: true })).resolves.toEqual([]);

		expect(mockedGetMessageById).not.toHaveBeenCalled();
	});

	it('adds no Loader Row when neither end has more', async () => {
		const messages = buildMessages();

		await expect(withChunkLoaders(messages, { moreBefore: false, moreAfter: false })).resolves.toEqual(messages);

		expect(mockedGetMessageById).not.toHaveBeenCalled();
	});

	it('prepends an Older Loader built from the first message when moreBefore is true and it is not local', async () => {
		const messages = buildMessages();

		const result = await withChunkLoaders(messages, { moreBefore: true, moreAfter: false });

		expect(mockedGetMessageById).toHaveBeenCalledWith('msg-1');
		expect(result).toHaveLength(messages.length + 1);
		expect(result[0]).toMatchObject({ _id: 'load-more-msg-1', rid: RID, t: MessageTypeLoad.PREVIOUS_CHUNK, msg: 'msg-msg-1' });
		expect(result.slice(1)).toEqual(messages);
	});

	it('prepends no Older Loader when moreBefore is true but the first message is already local', async () => {
		const messages = buildMessages();
		mockedGetMessageById.mockResolvedValue({ id: 'msg-1' } as never);

		await expect(withChunkLoaders(messages, { moreBefore: true, moreAfter: false })).resolves.toEqual(messages);
	});

	it('appends a Newer Loader built from the last message when moreAfter is true and it is not local', async () => {
		const messages = buildMessages();

		const result = await withChunkLoaders(messages, { moreBefore: false, moreAfter: true });

		expect(mockedGetMessageById).toHaveBeenCalledWith('msg-3');
		expect(result).toHaveLength(messages.length + 1);
		expect(result[result.length - 1]).toMatchObject({
			_id: 'load-more-msg-3',
			rid: RID,
			t: MessageTypeLoad.NEXT_CHUNK,
			msg: 'msg-msg-3'
		});
		expect(result.slice(0, -1)).toEqual(messages);
	});

	it('appends no Newer Loader when moreAfter is true but the last message is already local', async () => {
		const messages = buildMessages();
		mockedGetMessageById.mockResolvedValue({ id: 'msg-3' } as never);

		await expect(withChunkLoaders(messages, { moreBefore: false, moreAfter: true })).resolves.toEqual(messages);
	});

	it('checks each end on its own message when both ends have more', async () => {
		const messages = buildMessages();
		mockedGetMessageById.mockImplementation((async (id: string) => (id === 'msg-1' ? { id } : null)) as never);

		const result = await withChunkLoaders(messages, { moreBefore: true, moreAfter: true });

		expect(result.map(m => m._id)).toEqual(['msg-1', 'msg-2', 'msg-3', 'load-more-msg-3']);
	});

	it('wraps the Chunk in an Older and a Newer Loader when neither end is local', async () => {
		const messages = buildMessages();

		const result = await withChunkLoaders(messages, { moreBefore: true, moreAfter: true });

		expect(result.map(m => m._id)).toEqual(['load-more-msg-1', 'msg-1', 'msg-2', 'msg-3', 'load-more-msg-3']);
		expect(result[0].t).toBe(MessageTypeLoad.PREVIOUS_CHUNK);
		expect(result[result.length - 1].t).toBe(MessageTypeLoad.NEXT_CHUNK);
	});

	it('leaves the array it was given unchanged', async () => {
		const messages = buildMessages();

		await withChunkLoaders(messages, { moreBefore: true, moreAfter: true });

		expect(messages.map(m => m._id)).toEqual(['msg-1', 'msg-2', 'msg-3']);
	});
});

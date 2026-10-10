import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { getNextMessages } from '../restApi';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		methodCallWrapper: jest.fn()
	}
}));

const mockedGet = sdk.get as jest.Mock;
const mockedMethodCallWrapper = sdk.methodCallWrapper as jest.Mock;

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

const RID = 'ROOM_ID';
const AFTER_MS = 1704110400000;
const AFTER = new Date(AFTER_MS);
const COUNT = 3;

const restResponse = (ids: string[], next: string | null) => ({
	success: true,
	messages: ids.map(_id => ({ _id, rid: RID })),
	cursor: { next, previous: String(AFTER_MS + 1000) }
});

const ddpResponse = (ids: string[]) => ({
	messages: ids.map((_id, index) => ({ _id, rid: RID, ts: { $date: AFTER_MS + 1000 + index } }))
});

describe('getNextMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.9.0');
		mockedGet.mockResolvedValue(restResponse([], null));
		mockedMethodCallWrapper.mockResolvedValue(ddpResponse([]));
	});

	it.each([
		['8.8.9', 1, 0],
		['8.9.0', 0, 1],
		['8.10.0', 0, 1]
	])('server %s makes %i DDP call(s) and %i REST call(s)', async (version, ddpCalls, restCalls) => {
		setServerVersion(version);

		await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

		expect(mockedMethodCallWrapper).toHaveBeenCalledTimes(ddpCalls);
		expect(mockedGet).toHaveBeenCalledTimes(restCalls);
	});

	it('requests the messages after the given timestamp without thread replies', async () => {
		await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

		expect(mockedGet).toHaveBeenCalledWith('rooms.history', {
			roomId: RID,
			next: String(AFTER_MS),
			count: COUNT,
			showThreadMessages: false
		});
	});

	it.each([
		['more newer messages exist', String(AFTER_MS + 3000), true],
		['no newer messages exist', null, false]
	])('reports hasMore from the cursor when %s', async (_name, next, hasMore) => {
		mockedGet.mockResolvedValue(restResponse(['a', 'b', 'c'], next));

		const result = await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

		expect(result.hasMore).toBe(hasMore);
		expect(result.messages.map(message => message._id)).toEqual(['a', 'b', 'c']);
	});

	it('converts the ISO _updatedAt of each REST message to a Date', async () => {
		const updatedAt = '2024-01-15T12:00:00.000Z';
		mockedGet.mockResolvedValue({
			...restResponse([], null),
			messages: [{ _id: 'a', rid: RID, _updatedAt: updatedAt }]
		});

		const result = await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

		expect(result.messages[0]._updatedAt).toEqual(new Date(updatedAt));
	});

	it('rejects instead of returning no messages when the response is not successful', async () => {
		mockedGet.mockResolvedValue({ success: false, error: 'error-invalid-room' });

		await expect(getNextMessages({ rid: RID, after: AFTER, count: COUNT })).rejects.toThrow('Unable to load newer messages');
	});

	it('does not turn a failed REST call into an empty response', async () => {
		const error = { status: 429 };
		mockedGet.mockRejectedValue(error);

		await expect(getNextMessages({ rid: RID, after: AFTER, count: COUNT })).rejects.toBe(error);
	});

	describe('below 8.9.0', () => {
		beforeEach(() => setServerVersion('8.8.9'));

		it('asks the DDP method for the messages after the given timestamp', async () => {
			await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

			expect(mockedMethodCallWrapper).toHaveBeenCalledWith('loadNextMessages', RID, AFTER, COUNT);
		});

		it.each([
			['a full response', ['a', 'b', 'c'], true],
			['a partial response', ['a', 'b'], false]
		])('decodes the DDP dates and guesses hasMore from %s', async (_name, ids, hasMore) => {
			mockedMethodCallWrapper.mockResolvedValue(ddpResponse(ids));

			const result = await getNextMessages({ rid: RID, after: AFTER, count: COUNT });

			expect(result.hasMore).toBe(hasMore);
			expect(result.messages[0].ts).toEqual(new Date(AFTER_MS + 1000));
		});

		it('rejects a DDP reply without messages instead of reporting nothing newer', async () => {
			mockedMethodCallWrapper.mockResolvedValue(undefined);

			await expect(getNextMessages({ rid: RID, after: AFTER, count: COUNT })).rejects.toThrow('Unable to load newer messages');
		});
	});
});

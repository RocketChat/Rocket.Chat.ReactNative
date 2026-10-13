import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { getSurroundingMessages } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
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
const MESSAGE_ID = 'TARGET_ID';
const TARGET_MS = 1704110400000;
const COUNT = 3;

const restResponse = (ids: string[], cursor: { next: string | null; previous: string | null }) => ({
	success: true,
	messages: ids.map(_id => ({ _id, rid: RID })),
	cursor
});

const NO_MORE = { next: null, previous: null };

const ddpResponse = (ids: string[], moreBefore: boolean, moreAfter: boolean) => ({
	messages: ids.map((_id, index) => ({ _id, rid: RID, ts: { $date: TARGET_MS + index } })),
	moreBefore,
	moreAfter
});

describe('getSurroundingMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.9.0');
		mockedGet.mockResolvedValue(restResponse([], NO_MORE));
		mockedMethodCallWrapper.mockResolvedValue(ddpResponse([], false, false));
	});

	it.each([
		['8.8.9', 1, 0],
		['8.9.0', 0, 1],
		['8.10.0', 0, 1]
	])('server %s makes %i DDP call(s) and %i REST call(s)', async (version, ddpCalls, restCalls) => {
		setServerVersion(version);

		await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

		expect(mockedMethodCallWrapper).toHaveBeenCalledTimes(ddpCalls);
		expect(mockedGet).toHaveBeenCalledTimes(restCalls);
	});

	it('requests the window around the message without thread replies', async () => {
		await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

		expect(mockedGet).toHaveBeenCalledWith('rooms.history', {
			roomId: RID,
			aroundId: MESSAGE_ID,
			count: COUNT,
			showThreadMessages: false
		});
	});

	it.each([
		['older and newer messages exist', { next: '1704110403000', previous: '1704110397000' }, true, true],
		['only older messages exist', { next: null, previous: '1704110397000' }, true, false],
		['only newer messages exist', { next: '1704110403000', previous: null }, false, true],
		['the window reaches both ends of the room', NO_MORE, false, false]
	])('reports moreBefore and moreAfter from the cursor when %s', async (_name, cursor, moreBefore, moreAfter) => {
		mockedGet.mockResolvedValue(restResponse(['a', 'b', 'c'], cursor));

		const result = await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

		expect(result.moreBefore).toBe(moreBefore);
		expect(result.moreAfter).toBe(moreAfter);
		expect(result.messages.map(message => message._id)).toEqual(['a', 'b', 'c']);
	});

	it('converts the ISO _updatedAt of each REST message to a Date', async () => {
		const updatedAt = '2024-01-15T12:00:00.000Z';
		mockedGet.mockResolvedValue({
			...restResponse([], NO_MORE),
			messages: [{ _id: 'a', rid: RID, _updatedAt: updatedAt }]
		});

		const result = await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

		expect(result.messages[0]._updatedAt).toEqual(new Date(updatedAt));
	});

	it('rejects instead of returning no messages when the response is not successful', async () => {
		mockedGet.mockResolvedValue({ success: false, error: 'error-invalid-room' });

		await expect(getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT })).rejects.toThrow(
			'Unable to load room history'
		);
	});

	it('does not turn a failed REST call into an empty response', async () => {
		const error = { status: 404 };
		mockedGet.mockRejectedValue(error);

		await expect(getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT })).rejects.toBe(error);
	});

	describe('below 8.9.0', () => {
		beforeEach(() => setServerVersion('8.8.9'));

		it('asks the DDP method for the window around the message', async () => {
			await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

			expect(mockedMethodCallWrapper).toHaveBeenCalledWith('loadSurroundingMessages', { _id: MESSAGE_ID, rid: RID }, COUNT);
		});

		it('decodes the DDP dates and passes moreBefore and moreAfter through', async () => {
			mockedMethodCallWrapper.mockResolvedValue(ddpResponse(['a', 'b', 'c'], true, false));

			const result = await getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT });

			expect(result.moreBefore).toBe(true);
			expect(result.moreAfter).toBe(false);
			expect(result.messages[0].ts).toEqual(new Date(TARGET_MS));
		});

		it('rejects when the DDP method refuses with false', async () => {
			mockedMethodCallWrapper.mockResolvedValue(false);

			await expect(getSurroundingMessages({ rid: RID, messageId: MESSAGE_ID, count: COUNT })).rejects.toThrow(
				'Unable to load surrounding messages'
			);
		});
	});
});

import { loadMissedMessages } from './loadMissedMessages';
import sdk from '../services/sdk';
import updateMessages from './updateMessages';
import { updateLastOpen } from './updateLastOpen';
import { store } from '../store/auxStore';
import log from './helpers/log';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn()
	}
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ server: { version: '7.4.0' } })),
		dispatch: jest.fn()
	}
}));

jest.mock('./updateMessages', () => jest.fn());
jest.mock('./updateLastOpen', () => ({
	...jest.requireActual('./updateLastOpen'),
	updateLastOpen: jest.fn()
}));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedUpdateLastOpen = updateLastOpen as jest.MockedFunction<typeof updateLastOpen>;
const mockedLog = log as jest.MockedFunction<typeof log>;

const RID = 'ROOM_ID';
const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));

describe('loadMissedMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.4.0' } });
	});

	it('syncs both cursors from the captured Last Open', async () => {
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID, cursor: CURSOR });

		expect(mockedSdkGet).toHaveBeenCalledTimes(2);
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', {
			roomId: RID,
			next: CURSOR.getTime(),
			count: 50,
			type: 'UPDATED'
		});
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', {
			roomId: RID,
			next: CURSOR.getTime(),
			count: 50,
			type: 'DELETED'
		});
	});

	it('routes a deleted-only recursion payload to remove, not update', async () => {
		const deletedMessage = { _id: 'deleted-1', rid: RID, _updatedAt: new Date(Date.UTC(2024, 0, 1, 12, 0, 0)) };
		mockedSdkGet.mockResolvedValue({
			result: { updated: [], deleted: [deletedMessage], cursor: { next: null } }
		} as never);

		await loadMissedMessages({ rid: RID, cursor: CURSOR, deletedNext: 1704110400000 });

		expect(mockedSdkGet).toHaveBeenCalledTimes(1);
		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ roomId: RID, type: 'DELETED' }));
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: [],
				remove: [deletedMessage]
			})
		);
	});

	it('fetches only the updated page on an updated continuation', async () => {
		const UPDATED_NEXT = Date.UTC(2024, 0, 1, 11, 30, 0);
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [], cursor: { next: null } } } as never);

		await loadMissedMessages({ rid: RID, cursor: CURSOR, updatedNext: UPDATED_NEXT });

		expect(mockedSdkGet).toHaveBeenCalledTimes(1);
		expect(mockedSdkGet).toHaveBeenCalledWith(
			'chat.syncMessages',
			expect.objectContaining({ next: UPDATED_NEXT, type: 'UPDATED' })
		);
	});

	describe('last open', () => {
		const message = (id: string, updatedAt: string) => ({ _id: id, rid: RID, _updatedAt: updatedAt });

		it('writes the Last Open from the updated payload once the cursor has drained', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});

		it('writes once, after the whole pagination chain, from the stamps of every page', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			const updatedPagesFetched: (number | undefined)[] = [];
			const lastOpenWritesBeforeEachUpdatedPage: number[] = [];
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				updatedPagesFetched.push(params.next);
				lastOpenWritesBeforeEachUpdatedPage.push(mockedUpdateLastOpen.mock.calls.length);
				if (params.next === PAGE_2) {
					return Promise.resolve({
						result: { updated: [message('b', '2024-01-01T11:45:00.000Z')], deleted: [], cursor: { next: null } }
					});
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: PAGE_2 } }
				});
			}) as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			expect(updatedPagesFetched).toEqual([CURSOR.getTime(), PAGE_2]);
			expect(lastOpenWritesBeforeEachUpdatedPage).toEqual([0, 0]);
			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [
				{ _updatedAt: '2024-01-01T11:30:00.000Z' },
				{ _updatedAt: '2024-01-01T11:45:00.000Z' }
			]);
		});

		it('keeps the highest _updatedAt when it arrives on an earlier page', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				if (params.next === PAGE_2) {
					return Promise.resolve({
						result: { updated: [message('b', '2024-01-01T11:10:00.000Z')], deleted: [], cursor: { next: null } }
					});
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:59:00.000Z')], deleted: [], cursor: { next: PAGE_2 } }
				});
			}) as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			const received = mockedUpdateLastOpen.mock.calls[0][1];
			const timestamps = received.map(m => new Date(m._updatedAt as string | Date).getTime()).filter(t => !Number.isNaN(t));
			expect(new Date(Math.max(...timestamps))).toEqual(new Date('2024-01-01T11:59:00.000Z'));
		});

		it('does not write again on a deleted-only continuation page', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [], deleted: [message('gone', '2024-01-01T11:30:00.000Z')], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR, deletedNext: Date.UTC(2024, 0, 1, 11, 30, 0) });

			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		});

		it('writes nothing derived from deleted rows when the payload is deleted-only', async () => {
			mockedSdkGet.mockResolvedValue({
				result: { updated: [], deleted: [message('gone', '2024-01-01T11:30:00.000Z')], cursor: { next: null } }
			} as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, []);
		});

		it('waits for a deleted continuation before writing the Last Open', async () => {
			const DELETED_PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			let deletedPagesFetched = 0;
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string }) => {
				if (params.type === 'DELETED') {
					deletedPagesFetched += 1;
					return Promise.resolve({
						result: { deleted: [], cursor: { next: deletedPagesFetched === 1 ? DELETED_PAGE_2 : null } }
					});
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: null } }
				});
			}) as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			expect(deletedPagesFetched).toBe(2);
			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});

		it('logs a failed continuation and leaves the Last Open where it was', async () => {
			const PAGE_2 = Date.UTC(2024, 0, 1, 11, 30, 0);
			const failure = new Error('network down');
			mockedSdkGet.mockImplementation(((_endpoint: string, params: { type?: string; next?: number }) => {
				if (params.type === 'DELETED') {
					return Promise.resolve({ result: { deleted: [], cursor: { next: null } } });
				}
				if (params.next === PAGE_2) {
					return Promise.reject(failure);
				}
				return Promise.resolve({
					result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [], cursor: { next: PAGE_2 } }
				});
			}) as never);

			await expect(loadMissedMessages({ rid: RID, cursor: CURSOR })).resolves.toBeUndefined();

			expect(mockedLog).toHaveBeenCalledWith(failure);
			expect(mockedUpdateLastOpen).not.toHaveBeenCalled();
		});

		it('writes once on the legacy unpaginated server branch', async () => {
			(store.getState as jest.Mock).mockReturnValue({ server: { version: '7.0.0' } });
			mockedSdkGet.mockResolvedValue({
				result: { updated: [message('a', '2024-01-01T11:30:00.000Z')], deleted: [] }
			} as never);

			await loadMissedMessages({ rid: RID, cursor: CURSOR });

			expect(mockedSdkGet).toHaveBeenCalledWith(
				'chat.syncMessages',
				expect.objectContaining({ lastUpdate: CURSOR.toISOString() })
			);
			expect(mockedUpdateLastOpen).toHaveBeenCalledTimes(1);
			expect(mockedUpdateLastOpen).toHaveBeenCalledWith(RID, [{ _updatedAt: '2024-01-01T11:30:00.000Z' }]);
		});
	});
});

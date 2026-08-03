import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { tsToMs } from '../../../lib/dayjs';
import getLocalAnchorTs from './getLocalAnchor';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

const mockDbGet = database.active.get as unknown as jest.Mock;

// Mock the WatermelonDB query chain. The mock fetch ignores clauses (it cannot evaluate them), so each
// test seeds the rows that the targeted "nearest Newer Loader above the target" query would return.
const mockQuery = (rows: unknown[]) => {
	const fetch = jest.fn(() => Promise.resolve(rows));
	const query = jest.fn(() => ({ fetch }));
	mockDbGet.mockReturnValue({ query });
	return { query, fetch };
};

describe('getLocalAnchorTs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('queries the messages collection', async () => {
		const { query } = mockQuery([]);
		await getLocalAnchorTs('ROOM_ID', new Date('2024-01-01'));
		expect(mockDbGet).toHaveBeenCalledWith('messages');
		expect(query).toHaveBeenCalled();
	});

	it('builds the correct query clause shape', async () => {
		const rid = 'ROOM_A';
		const targetTs = new Date('2024-06-01T12:00:00.000Z');
		const targetMs = tsToMs(targetTs);
		const { query } = mockQuery([]);
		await getLocalAnchorTs(rid, targetTs);
		expect(query.mock.calls[0]).toEqual([
			Q.where('rid', rid),
			Q.where('t', MessageTypeLoad.NEXT_CHUNK),
			Q.where('ts', Q.gt(targetMs)),
			Q.sortBy('ts', Q.asc),
			Q.take(1)
		]);
	});

	it('returns the ts (ms) of the nearest Newer Loader above the target', async () => {
		const loaderTs = new Date('2024-01-02T00:00:00.000Z');
		mockQuery([{ id: 'loader', t: 'load_next_chunk', ts: loaderTs }]);
		const result = await getLocalAnchorTs('ROOM_ID', new Date('2024-01-01'));
		expect(result).toBe(loaderTs.getTime());
	});

	it('returns null when no Newer Loader sits above the target (contiguous region)', async () => {
		mockQuery([]);
		const result = await getLocalAnchorTs('ROOM_ID', new Date('2024-01-01'));
		expect(result).toBeNull();
	});

	it('accepts a numeric ts and still resolves the loader bound', async () => {
		const loaderTs = 1_700_000_050_000;
		mockQuery([{ id: 'loader', t: 'load_next_chunk', ts: loaderTs }]);
		const result = await getLocalAnchorTs('ROOM_ID', 1_700_000_000_000);
		expect(result).toBe(loaderTs);
	});
});

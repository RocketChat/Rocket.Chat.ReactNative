import database from '../index';
import { SUBSCRIPTIONS_TABLE } from '../model/Subscription';
import { type TSubscriptionModel } from '../../../definitions';
import { getDMSubscriptionByUsername } from './Subscription';

jest.mock('../index', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

const mockGet = database.active.get as jest.Mock;

describe('getDMSubscriptionByUsername', () => {
	let mockFetch: jest.Mock;

	beforeEach(() => {
		mockFetch = jest.fn();
		mockGet.mockReturnValue({
			query: jest.fn(() => ({ fetch: mockFetch }))
		});
	});

	it('returns subscription when DM exists', async () => {
		const sub = { id: 'sub-1', name: 'alice', t: 'd', rid: 'rid-1' } as unknown as TSubscriptionModel;
		mockFetch.mockResolvedValue([sub]);

		const result = await getDMSubscriptionByUsername('alice');

		expect(result).toBe(sub);
		expect(mockGet).toHaveBeenCalledWith(SUBSCRIPTIONS_TABLE);
	});

	it('returns null when no DM exists', async () => {
		mockFetch.mockResolvedValue([]);

		const result = await getDMSubscriptionByUsername('nobody');

		expect(result).toBeNull();
	});

	it('returns null when username is empty and does not query the database', async () => {
		mockGet.mockClear();

		const result = await getDMSubscriptionByUsername('');

		expect(result).toBeNull();
		expect(mockGet).not.toHaveBeenCalled();
	});
});

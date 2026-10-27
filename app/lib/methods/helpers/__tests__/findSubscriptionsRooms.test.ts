import { type IServerRoom, type IServerSubscription } from '~/definitions';
import findSubscriptionsRooms from '../findSubscriptionsRooms';

const storedSubscription = { _id: 'sub-1', rid: 'room-1', name: 'general', category: 'work' };

jest.mock('~/lib/database', () => ({
	active: {
		get: () => ({
			query: () => ({ fetch: () => Promise.resolve([storedSubscription]) })
		})
	}
}));

describe('findSubscriptionsRooms', () => {
	it('keeps the stored category when a room changes without its subscription', async () => {
		const rooms = [{ _id: 'room-1' }] as IServerRoom[];

		const [subscription] = await findSubscriptionsRooms([] as IServerSubscription[], rooms);

		expect(subscription.category).toBe('work');
	});
});

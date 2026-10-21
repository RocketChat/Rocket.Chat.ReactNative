import { type IServerSubscription } from '~/definitions';
import { merge } from '../mergeSubscriptionsRooms';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.0.0' } }) }
}));

describe('merge', () => {
	it('clears the stored category when the subscription no longer has one', () => {
		const storedSubscription = { category: 'work' };
		const subscription = { _id: 'sub-1', rid: 'room-1', name: 'general' } as IServerSubscription;

		Object.assign(storedSubscription, merge(subscription));

		expect(storedSubscription.category).toBeUndefined();
	});
});

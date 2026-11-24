import { type IServerSubscription } from '~/definitions/ISubscription';
import { merge } from '../mergeSubscriptionsRooms';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.0.0' } }) }
}));

describe('merge', () => {
	it.each(['category', 'E2EKey'])('clears the stored %s when the server subscription no longer has one', field => {
		const storedSubscription: Record<string, unknown> = { [field]: 'stale-value' };
		const subscription = { _id: 'sub-1', rid: 'room-1', name: 'general' } as IServerSubscription;

		Object.assign(storedSubscription, merge(subscription));

		expect(storedSubscription[field]).toBeUndefined();
	});
});

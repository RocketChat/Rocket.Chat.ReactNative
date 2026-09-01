import { updateLastOpen } from './updateLastOpen';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';

jest.mock('../database', () => ({
	__esModule: true,
	default: { active: { write: jest.fn((cb: () => Promise<void>) => cb()) } }
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedLog = log as jest.MockedFunction<typeof log>;

const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';

const makeSubscription = (lastOpen: Date | null) => {
	const subscription = {
		lastOpen,
		update: (updater: (s: { lastOpen: Date | null }) => void) => {
			updater(subscription);
			return Promise.resolve();
		}
	};
	return subscription;
};

describe('updateLastOpen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('persists the newest server _updatedAt in the payload', async () => {
		const subscription = makeSubscription(null);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [
			{ _updatedAt: '2024-01-01T10:00:00.000Z' },
			{ _updatedAt: '2024-01-01T12:00:00.000Z' },
			{ _updatedAt: '2024-01-01T11:00:00.000Z' }
		]);

		expect(subscription.lastOpen).toEqual(new Date('2024-01-01T12:00:00.000Z'));
	});

	it('ignores entries with no _updatedAt', async () => {
		const subscription = makeSubscription(null);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [{ _updatedAt: '2024-01-01T10:00:00.000Z' }, {}, {}]);

		expect(subscription.lastOpen).toEqual(new Date('2024-01-01T10:00:00.000Z'));
	});

	it('ignores malformed _updatedAt values', async () => {
		const subscription = makeSubscription(null);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [{ _updatedAt: 'not-a-date' }, { _updatedAt: '2024-01-01T12:00:00.000Z' }, { _updatedAt: '' }]);

		expect(subscription.lastOpen).toEqual(new Date('2024-01-01T12:00:00.000Z'));
	});

	it('does not write when every _updatedAt is null', async () => {
		const subscription = makeSubscription(null);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [{ _updatedAt: null }, { _updatedAt: null }]);

		expect(subscription.lastOpen).toBeNull();
	});

	it('does not write when every _updatedAt is invalid', async () => {
		const subscription = makeSubscription(null);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [{ _updatedAt: 'not-a-date' }, { _updatedAt: '' }, {}]);

		expect(subscription.lastOpen).toBeNull();
	});

	it('is a no-op on an empty payload', async () => {
		await updateLastOpen(RID, []);

		expect(mockedGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it('overwrites a cursor already poisoned into the future, so the room self-heals', async () => {
		const poisonedFutureCursor = new Date('2099-01-01T00:00:00.000Z');
		const subscription = makeSubscription(poisonedFutureCursor);
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription as never);

		await updateLastOpen(RID, [{ _updatedAt: '2024-01-01T12:00:00.000Z' }]);

		expect(subscription.lastOpen).toEqual(new Date('2024-01-01T12:00:00.000Z'));
	});

	it('is a silent no-op when the subscription row does not exist', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue(null as never);

		await expect(updateLastOpen(RID, [{ _updatedAt: '2024-01-01T12:00:00.000Z' }])).resolves.toBeUndefined();
	});

	it('is a silent no-op when the subscription is deleted between the read and the write', async () => {
		const subscription = makeSubscription(null);
		const deletedSubscription = {
			...subscription,
			syncStatus: 'deleted',
			update: () => {
				throw new Error(`Not allowed to change deleted record subscriptions#${RID}`);
			}
		};
		mockedGetSubscriptionByRoomId.mockResolvedValue(deletedSubscription as never);

		await updateLastOpen(RID, [{ _updatedAt: '2024-01-01T12:00:00.000Z' }]);

		expect(mockedLog).not.toHaveBeenCalled();
	});
});

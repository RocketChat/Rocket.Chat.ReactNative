import { createOrUpdateSubscription } from '../rooms';
import { updateLastOpen } from '../../updateLastOpen';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { getMessageById } from '~/lib/database/services/Message';
import log from '../../helpers/log';
import database from '~/lib/database';

jest.mock('../../../services/sdk', () => ({
	__esModule: true,
	default: {}
}));

jest.mock('../../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({ room: { subscribedRoom: null } })),
		dispatch: jest.fn()
	}
}));

jest.mock('../../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../helpers/getRoomAvatar', () => ({
	getRoomAvatar: jest.fn()
}));
jest.mock('../../helpers/getRoomTitle', () => ({
	getRoomTitle: jest.fn()
}));
jest.mock('../../helpers/getSenderName', () => ({
	getSenderName: jest.fn()
}));
jest.mock('../../helpers/random', () => ({
	random: jest.fn()
}));

jest.mock('../../helpers/protectedFunction', () => ({
	__esModule: true,
	default: (fn: (...args: unknown[]) => unknown) => fn
}));

jest.mock('../../helpers/buildMessage', () => ({
	__esModule: true,
	default: (msg: unknown) => msg
}));

jest.mock('../../helpers/mergeSubscriptionsRooms', () => ({
	merge: (subscription: unknown) => subscription
}));

jest.mock('../../../encryption', () => ({
	Encryption: {
		decryptPendingSubscriptions: jest.fn(),
		decryptPendingMessages: jest.fn(),
		getRoomInstance: jest.fn()
	}
}));

jest.mock('../../updateMessages', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../getRoom', () => ({
	getRoom: jest.fn()
}));

jest.mock('~/lib/apps/actions', () => ({
	handlePayloadUserInteraction: jest.fn()
}));

jest.mock('../../../../actions/room', () => ({
	removedRoom: jest.fn()
}));

jest.mock('../../../../actions/login', () => ({
	setUser: jest.fn()
}));

jest.mock('../../../../actions/videoConf', () => ({
	handleVideoConfIncomingWebsocketMessages: jest.fn()
}));

jest.mock('../../../../containers/InAppNotification', () => ({
	INAPP_NOTIFICATION_EMITTER: 'NotificationInApp'
}));

const mockDbBatch = jest.fn();
jest.mock('../../../database', () => {
	let writerQueue: Promise<unknown> = Promise.resolve();
	const mockCollection = {
		find: jest.fn(() => Promise.reject(new Error('not found'))),
		prepareCreate: jest.fn(() => ({})),
		schema: {}
	};
	return {
		__esModule: true,
		default: {
			active: {
				get: () => mockCollection,
				write: jest.fn((callback: () => Promise<void>) => {
					const run = writerQueue.then(() => callback());
					writerQueue = run.catch(() => undefined);
					return run;
				}),
				batch: (...args: unknown[]) => mockDbBatch(...args)
			}
		}
	};
});

jest.mock('~/lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('~/lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

const rid = 'GENERAL';

// Mimics a WatermelonDB Model: one cached instance per record, and
// prepareUpdate throws while a previous prepared update is not committed.
const makeSubscriptionRecord = () => {
	const record: any = {
		rid,
		lastOpen: null,
		_preparedState: null as string | null,
		prepareUpdate(recordUpdater: (s: any) => void) {
			if (record._preparedState) {
				throw new Error(`Cannot update a record with pending changes (subscriptions#${rid})`);
			}
			recordUpdater(record);
			record._preparedState = 'update';
			return record;
		},
		update(recordUpdater: (s: any) => void) {
			record.prepareUpdate(recordUpdater);
			record._preparedState = null;
			return Promise.resolve(record);
		}
	};
	return record;
};

describe('createOrUpdateSubscription concurrency', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDbBatch.mockImplementation((batch: any[]) => {
			(Array.isArray(batch) ? batch : [batch]).forEach(item => {
				if (item && typeof item === 'object' && '_preparedState' in item) {
					item._preparedState = null;
				}
			});
			return Promise.resolve(undefined);
		});
	});

	it('does not leave a prepared subscription visible to a concurrent updateLastOpen', async () => {
		const record = makeSubscriptionRecord();
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(record);
		// Slow message lookup keeps createOrUpdateSubscription busy after it fetched the subscription.
		(getMessageById as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(null), 10)));

		const subscription = {
			rid,
			_id: rid,
			lastMessage: { _id: 'msg-id', rid, msg: 'hi' }
		} as any;

		await Promise.all([
			createOrUpdateSubscription(subscription, undefined as any),
			updateLastOpen(rid, [{ _updatedAt: '2026-01-01T12:00:00.000Z' }])
		]);

		const loggedPendingChanges = (log as jest.Mock).mock.calls.some(([error]) => /pending changes/.test(error?.message));
		expect(loggedPendingChanges).toBe(false);
		expect(record.lastOpen).toEqual(new Date('2026-01-01T12:00:00.000Z'));
	});
});

describe('createOrUpdateSubscription room placeholder', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDbBatch.mockResolvedValue(undefined);
	});

	it('deletes the room placeholder in the same batch that updates the subscription from it', async () => {
		const destroyedPlaceholder = { destroyed: rid };
		const placeholderRoom = { e2eKeyId: 'stale-key-id', prepareDestroyPermanently: jest.fn(() => destroyedPlaceholder) };
		const roomsCollection = database.active.get('rooms') as unknown as { find: jest.Mock };
		roomsCollection.find.mockResolvedValueOnce(placeholderRoom);
		const subscriptionRecord = makeSubscriptionRecord();
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(subscriptionRecord);

		await createOrUpdateSubscription({ rid, _id: rid } as any, undefined as any);

		expect(mockDbBatch).toHaveBeenCalledWith(expect.arrayContaining([subscriptionRecord, destroyedPlaceholder]));
	});

	it('keeps the room placeholder when the subscription update cannot be prepared', async () => {
		const destroyedPlaceholder = { destroyed: rid };
		const placeholderRoom = { prepareDestroyPermanently: jest.fn(() => destroyedPlaceholder) };
		const roomsCollection = database.active.get('rooms') as unknown as { find: jest.Mock };
		roomsCollection.find.mockResolvedValueOnce(placeholderRoom);
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({
			prepareUpdate: () => {
				throw new Error('pending changes');
			}
		});

		await createOrUpdateSubscription({ rid, _id: rid } as any, undefined as any);

		expect(placeholderRoom.prepareDestroyPermanently).not.toHaveBeenCalled();
	});
});

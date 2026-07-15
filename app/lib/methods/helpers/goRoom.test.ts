import { InteractionManager } from 'react-native';

import { goRoom } from './goRoom';
import { getOrCreateRoomStore, releaseRoomStore } from '../../../views/RoomView/stores/RoomStore';

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(() => ({ name: 'RoomsListView' })),
		setParams: jest.fn(),
		popTo: jest.fn(),
		dispatch: jest.fn()
	}
}));

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null))
}));

// RoomStore transitive imports pull native/ESM modules (mobile-crypto via readMessages);
// stub them so importing goRoom -> RoomStore stays runnable under jest.
jest.mock('../readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../loadThreadMessages', () => ({ loadThreadMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../services/restApi', () => ({ getUserInfo: jest.fn() }));
jest.mock('../isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../../views/RoomView/services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({
			settings: {},
			login: { user: { id: 'u1', username: 'user' } }
		})
	}
}));
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({
				query: () => ({ observeWithColumns: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) }) })
			})
		}
	}
}));

let graceCb: (() => void) | undefined;

describe('goRoom RoomStore warm-up', () => {
	beforeEach(() => {
		graceCb = undefined;
		jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
			graceCb = cb;
			return { then: () => {} };
		}) as unknown as typeof InteractionManager.runAfterInteractions);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('releases the warmed store when navigation is effectively cancelled (no mount)', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		// warm-up left refCount at 1

		expect(graceCb).toBeDefined();

		// Probe the warmed entry to capture its instance; this bumps refCount to 2, so
		// immediately undo the bump to keep the net count matching "no RoomView mounted".
		const s1 = getOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any }); // refCount 2
		releaseRoomStore('r1'); // refCount 1 (undo probe bump)

		graceCb!(); // grace release: refCount 1 -> 0, entry torn down

		const newStore = getOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any }); // refCount 1, fresh instance

		expect(newStore).not.toBe(s1);

		releaseRoomStore('r1');
	});

	it('keeps the store alive when RoomView mounts before the grace release fires', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);

		expect(graceCb).toBeDefined();

		// Simulate RoomView mounting and acquiring the same rid: refCount goes 1 -> 2.
		const mounted = getOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any });

		// Grace release fires after the transition: refCount goes 2 -> 1, still alive.
		graceCb!();

		const stillAlive = getOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any });
		expect(stillAlive).toBe(mounted);

		releaseRoomStore('r1');
		releaseRoomStore('r1');
	});

	it('does not warm up the store when there is no rid', async () => {
		await goRoom({ item: { t: 'c' as any }, isMasterDetail: false } as any);

		expect(graceCb).toBeUndefined();
	});
});

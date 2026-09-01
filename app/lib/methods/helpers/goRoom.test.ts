import { InteractionManager } from 'react-native';

import { goRoom } from './goRoom';
import { peekOrCreateRoomStore, acquireRoomStore, releaseRoomStore } from '../../../views/RoomView/stores/RoomStore';

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

	it('tears down the warmed store via its grace sweep when navigation is effectively cancelled (no mount)', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		// warm-up left the entry at refCount 0 and scheduled its own grace sweep

		expect(graceCb).toBeDefined();

		// Peek the warmed entry to capture its instance (peek does not touch refCount).
		const warmed = peekOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any });

		graceCb!(); // grace sweep: refCount 0 -> entry torn down

		const fresh = peekOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any }); // brand-new instance
		expect(fresh).not.toBe(warmed);

		releaseRoomStore('r1');
	});

	it('keeps the store alive when RoomView mounts before the grace sweep fires', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);

		expect(graceCb).toBeDefined();

		// Simulate RoomView mounting against the warmed entry and acquiring it: refCount 0 -> 1.
		const mounted = peekOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any });
		acquireRoomStore({ rid: 'r1' }, mounted);

		// Grace sweep fires after the transition: refCount is 1, so the entry stays alive.
		graceCb!();

		const stillAlive = peekOrCreateRoomStore({ rid: 'r1', initialRoom: {} as any });
		expect(stillAlive).toBe(mounted);

		releaseRoomStore('r1');
	});

	it('does not warm up the store when there is no rid', async () => {
		await goRoom({ item: { t: 'c' as any }, isMasterDetail: false } as any);

		expect(graceCb).toBeUndefined();
	});
});

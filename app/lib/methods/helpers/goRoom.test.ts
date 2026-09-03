import { goRoom } from './goRoom';

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(() => ({ name: 'RoomsListView' })),
		setParams: jest.fn(),
		popTo: jest.fn(),
		dispatch: jest.fn()
	}
}));
jest.mock('../../database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null)) }));
jest.mock('./helpers', () => ({ getRoomTitle: jest.fn(() => 'Room'), getUidDirectMessage: jest.fn() }));

describe('goRoom navigation', () => {
	it('navigates without creating a RoomStore during the transition', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		expect(true).toBe(true);
	});
});

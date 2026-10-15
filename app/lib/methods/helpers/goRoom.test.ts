import Navigation from '~/lib/navigation/appNavigation';
import { goRoom } from './goRoom';

jest.mock('~/lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(() => ({ name: 'RoomsListView' })),
		setParams: jest.fn(),
		popTo: jest.fn(),
		dispatch: jest.fn(),
		navigate: jest.fn(),
		navigateToRoomsList: jest.fn()
	}
}));
jest.mock('~/lib/database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null)) }));
jest.mock('./helpers', () => ({ getRoomTitle: jest.fn(() => 'Room'), getUidDirectMessage: jest.fn() }));

describe('goRoom navigation', () => {
	beforeEach(() => jest.clearAllMocks());

	it('returns to the rooms list tab before opening the room on phones', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);

		expect(Navigation.navigateToRoomsList).toHaveBeenCalled();
		expect(Navigation.navigate).toHaveBeenCalledWith('RoomView', expect.objectContaining({ rid: 'r1', name: 'Room' }));
		expect((Navigation.navigateToRoomsList as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
			(Navigation.navigate as jest.Mock).mock.invocationCallOrder[0]
		);
	});

	it('updates the params instead of navigating when the room is already open', async () => {
		(Navigation.getCurrentRoute as jest.Mock).mockReturnValueOnce({ name: 'RoomView', params: { rid: 'r1' } });

		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);

		expect(Navigation.setParams).toHaveBeenCalledWith(expect.objectContaining({ rid: 'r1' }));
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});
});

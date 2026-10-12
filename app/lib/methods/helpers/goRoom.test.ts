import Navigation from '~/lib/navigation/appNavigation';
import { goRoom } from './goRoom';

jest.mock('~/lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		getCurrentRoute: jest.fn(() => ({ name: 'RoomsListView' })),
		setParams: jest.fn(),
		popTo: jest.fn(),
		dispatch: jest.fn()
	}
}));
jest.mock('~/lib/database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn(() => Promise.resolve(null)) }));
jest.mock('./helpers', () => ({ getRoomTitle: jest.fn(() => 'Room'), getUidDirectMessage: jest.fn() }));

describe('goRoom navigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('navigates without creating a RoomStore during the transition', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		expect(Navigation.dispatch).toHaveBeenCalled();
	});

	it('updates params in-place when current route is the main room of the same room', async () => {
		(Navigation.getCurrentRoute as jest.Mock).mockReturnValue({
			name: 'RoomView',
			params: { rid: 'r1', t: 'c' }
		});

		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false, jumpToMessageId: 'm1' } as any);

		expect(Navigation.setParams).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: 'r1',
				jumpToMessageId: 'm1'
			})
		);
		expect(Navigation.dispatch).not.toHaveBeenCalled();
	});

	it('resets navigation stack when current route has tmid in the same room', async () => {
		(Navigation.getCurrentRoute as jest.Mock).mockReturnValue({
			name: 'RoomView',
			params: { rid: 'r1', tmid: 'tm1' }
		});

		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false, jumpToMessageId: 'm1' } as any);

		expect(Navigation.setParams).not.toHaveBeenCalled();
		expect(Navigation.popTo).toHaveBeenCalledWith('DrawerNavigator');
		expect(Navigation.dispatch).toHaveBeenCalled();

		const dispatchCallback = (Navigation.dispatch as jest.Mock).mock.calls[0][0];
		const action = dispatchCallback({ routes: [{ name: 'RoomsListView' }] });
		expect(action).toEqual(
			expect.objectContaining({
				type: 'RESET',
				payload: expect.objectContaining({
					routes: [
						{ name: 'RoomsListView' },
						{
							name: 'RoomView',
							params: expect.objectContaining({
								rid: 'r1',
								t: 'c',
								jumpToMessageId: 'm1'
							})
						}
					]
				})
			})
		);
	});

	it('resets navigation stack when current route is a different room', async () => {
		(Navigation.getCurrentRoute as jest.Mock).mockReturnValue({
			name: 'RoomView',
			params: { rid: 'r2', t: 'c' }
		});

		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);

		expect(Navigation.setParams).not.toHaveBeenCalled();
		expect(Navigation.popTo).toHaveBeenCalledWith('DrawerNavigator');
		expect(Navigation.dispatch).toHaveBeenCalled();
	});
});

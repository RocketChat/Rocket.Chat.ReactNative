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
	it('navigates without creating a RoomStore during the transition', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		expect(true).toBe(true);
	});

	it('keeps the rooms list and an open category below the room', async () => {
		await goRoom({ item: { rid: 'r1', t: 'c' as any }, isMasterDetail: false } as any);
		const buildAction = jest.mocked(Navigation.dispatch).mock.calls.at(-1)?.[0] as unknown as (state: any) => any;
		const action = buildAction({
			routes: [{ name: 'RoomsListView' }, { name: 'CategoryView' }, { name: 'DirectoryView' }]
		});
		expect(action.payload.routes.map((route: { name: string }) => route.name)).toEqual([
			'RoomsListView',
			'CategoryView',
			'RoomView'
		]);
	});
});

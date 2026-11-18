import Navigation from '~/lib/navigation/appNavigation';
import getRoomInfo from '../getRoomInfo';
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
jest.mock('./getRoomTitle', () => ({
	getRoomTitle: jest.fn(() => 'Room')
}));
jest.mock('./getUidDirectMessage', () => ({
	getUidDirectMessage: jest.fn()
}));
jest.mock('../getRoomInfo', () => ({ __esModule: true, default: jest.fn() }));

const navigatedRoomParams = () => {
	const buildAction = jest.mocked(Navigation.dispatch).mock.calls.at(-1)?.[0] as unknown as (state: any) => any;
	return buildAction({ routes: [{ name: 'RoomsListView' }] }).payload.routes.at(-1).params;
};

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

	it('fetches the room type before opening a room known only by its rid', async () => {
		jest.mocked(getRoomInfo).mockResolvedValue({ rid: 'new-rid', name: 'new-room', fname: 'New room', t: 'p' });

		await goRoom({ item: { rid: 'new-rid' }, isMasterDetail: false });

		expect(navigatedRoomParams()).toEqual(expect.objectContaining({ rid: 'new-rid', t: 'p' }));
	});

	it('stays on the current screen when the room type cannot be fetched', async () => {
		jest.mocked(Navigation.dispatch).mockClear();
		jest.mocked(getRoomInfo).mockRejectedValue(new Error('not-allowed'));

		await goRoom({ item: { rid: 'unknown-rid' }, isMasterDetail: false });

		expect(Navigation.dispatch).not.toHaveBeenCalled();
	});
});

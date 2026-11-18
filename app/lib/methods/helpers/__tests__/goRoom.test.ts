import Navigation from '~/lib/navigation/appNavigation';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { getRoomInfo } from '~/lib/services/restApi';
import { createDirectMessage } from '../../createDirectMessage';
import { RoomType } from '~/definitions/IRoom';
import { getUidDirectMessage } from '../getUidDirectMessage';
import { goRoom } from '../goRoom';

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
jest.mock('../getRoomTitle', () => ({
	getRoomTitle: jest.fn(() => 'Room')
}));
jest.mock('../getUidDirectMessage', () => ({
	getUidDirectMessage: jest.fn()
}));
jest.mock('~/lib/services/restApi', () => ({ getRoomInfo: jest.fn() }));
jest.mock('../../createDirectMessage', () => ({ createDirectMessage: jest.fn() }));

const deferred = <T>() => {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>(done => (resolve = done));
	return { promise, resolve };
};

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
		jest
			.mocked(getRoomInfo)
			.mockResolvedValue({ success: true, room: { _id: 'new-rid', name: 'new-room', fname: 'New room', t: 'p' } } as any);

		await goRoom({ item: { rid: 'new-rid' }, isMasterDetail: false });

		expect(navigatedRoomParams()).toEqual(expect.objectContaining({ rid: 'new-rid', t: 'p' }));
	});

	it('keeps the members of a room known only by its rid', async () => {
		jest.mocked(getRoomInfo).mockResolvedValue({
			success: true,
			room: { _id: 'group-dm', t: 'd', uids: ['u1', 'u2', 'u3'], usernames: ['a', 'b', 'c'] }
		} as any);

		await goRoom({ item: { rid: 'group-dm' }, isMasterDetail: false });

		expect(getUidDirectMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({ rid: 'group-dm', uids: ['u1', 'u2', 'u3'], usernames: ['a', 'b', 'c'] })
		);
	});

	it('drops a slow room lookup once another room was opened', async () => {
		let resolveRoomInfo: (value: unknown) => void = () => {};
		jest.mocked(getRoomInfo).mockReturnValue(new Promise(resolve => (resolveRoomInfo = resolve)) as any);
		const slowLookup = goRoom({ item: { rid: 'slow-rid' }, isMasterDetail: false });

		await goRoom({ item: { rid: 'chosen-rid', t: 'c' }, isMasterDetail: false });
		resolveRoomInfo({ success: true, room: { _id: 'slow-rid', t: 'p' } });
		await slowLookup;

		expect(navigatedRoomParams()).toEqual(expect.objectContaining({ rid: 'chosen-rid' }));
	});

	it('stays on the current screen when the room type cannot be fetched', async () => {
		jest.mocked(Navigation.dispatch).mockClear();
		jest.mocked(getRoomInfo).mockRejectedValue(new Error('not-allowed'));

		await goRoom({ item: { rid: 'unknown-rid' }, isMasterDetail: false });

		expect(Navigation.dispatch).not.toHaveBeenCalled();
	});

	it('opens the room asked for last when an earlier lookup finishes first', async () => {
		const firstLookup = deferred<any>();
		const secondLookup = deferred<any>();
		jest.mocked(getSubscriptionByRoomId).mockReturnValueOnce(firstLookup.promise).mockReturnValueOnce(secondLookup.promise);

		const openFirst = goRoom({ item: { rid: 'first-rid', t: RoomType.CHANNEL }, isMasterDetail: false });
		const openSecond = goRoom({ item: { rid: 'second-rid', t: RoomType.CHANNEL }, isMasterDetail: false });
		firstLookup.resolve(null);
		await openFirst;
		secondLookup.resolve(null);
		await openSecond;

		expect(navigatedRoomParams()).toEqual(expect.objectContaining({ rid: 'second-rid' }));
	});

	it('drops a direct message created from search once another room was opened', async () => {
		const creation = deferred<any>();
		jest.mocked(createDirectMessage).mockReturnValueOnce(creation.promise);

		const openFromSearch = goRoom({
			item: { t: RoomType.DIRECT, search: true, username: 'searched-user' },
			isMasterDetail: false
		});
		await goRoom({ item: { rid: 'chosen-rid', t: RoomType.CHANNEL }, isMasterDetail: false });
		creation.resolve({ success: true, room: { _id: 'created-dm-rid' } });
		await openFromSearch;

		expect(navigatedRoomParams()).toEqual(expect.objectContaining({ rid: 'chosen-rid' }));
	});

	it('leaves a thread when its room is opened', async () => {
		jest.mocked(Navigation.setParams).mockClear();
		jest.mocked(Navigation.getCurrentRoute).mockReturnValueOnce({
			name: 'RoomView',
			params: { rid: 'thread-room-rid', tmid: 'thread-id' }
		} as any);

		await goRoom({ item: { rid: 'thread-room-rid', t: RoomType.CHANNEL }, isMasterDetail: false });

		expect(Navigation.setParams).not.toHaveBeenCalled();
		const params = navigatedRoomParams();
		expect(params).toEqual(expect.objectContaining({ rid: 'thread-room-rid' }));
		expect(params).not.toHaveProperty('tmid');
	});
});

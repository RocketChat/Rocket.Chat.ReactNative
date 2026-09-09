import { act, render } from '@testing-library/react-native';

import database from '../../../lib/database';
import { createRoomStore, observeRoom } from '../stores/RoomStore';
import { RoomScreenContext } from '../stores/RoomScreenContext';
import { RoomStoreContext } from '../stores/RoomStoreContext';
import { MessageRow } from './MessageRow';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../../lib/methods/helpers/log', () => jest.fn());

jest.mock('react-redux', () => ({
	useSelector: jest.fn(() => undefined),
	useDispatch: () => jest.fn()
}));
const mockMessage = jest.fn();
jest.mock('../../../containers/message', () => ({
	__esModule: true,
	default: (props: unknown) => {
		mockMessage(props);
		return null;
	}
}));
jest.mock('../LoadMore', () => ({ __esModule: true, default: () => null }));

const mockGet = database.active.get as jest.Mock;

const setupObserve = () => {
	let emit: ((row: any) => void) | undefined;
	const unsubscribe = jest.fn();
	const find = jest.fn(() =>
		Promise.resolve({
			observe: () => ({
				subscribe: ({ next }: { next: (row: any) => void }) => {
					emit = next;
					return { unsubscribe };
				}
			})
		})
	);
	mockGet.mockReturnValue({ find });
	return { emit: (row: any) => emit?.(row) };
};

describe('MessageRow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('re-renders with fresh isIgnored when the same room instance re-emits a mutated ignored list', async () => {
		const { emit } = setupObserve();
		const sub: any = { id: 'sub-1', rid: 'rid-1', t: 'c', ignored: [] };
		const item: any = { id: 'msg-1', ts: new Date('2024-01-01T10:00:00Z'), u: { _id: 'author-1' } };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: sub });
		observeRoom('rid-1', store);
		await act(async () => {});

		render(
			<RoomStoreContext.Provider value={store}>
				<RoomScreenContext.Provider
					value={{ loading: false, failed: false, retry: jest.fn(), lastSeen: null, clearLastSeen: jest.fn() }}>
					<MessageRow item={item} previousItem={undefined as any} onLongPress={jest.fn()} />
				</RoomScreenContext.Provider>
			</RoomStoreContext.Provider>
		);

		act(() => emit(sub));
		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ isIgnored: false }));

		// Same instance, same ref — mirrors WatermelonDB's mutate-in-place re-emit.
		sub.ignored = ['author-1'];
		act(() => emit(sub));

		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ isIgnored: true }));
	});
	it('only re-renders for unread changes that change this message badge', async () => {
		const { emit } = setupObserve();
		const sub: any = { id: 'sub-1', rid: 'rid-1', t: 'c', tunread: [], tunreadUser: [], tunreadGroup: [] };
		const item: any = { id: 'msg-1', ts: new Date('2024-01-01T10:00:00Z'), u: { _id: 'author-1' } };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: sub });
		const cleanup = observeRoom('rid-1', store);
		await act(async () => {});

		render(
			<RoomStoreContext.Provider value={store}>
				<RoomScreenContext.Provider
					value={{ loading: false, failed: false, retry: jest.fn(), lastSeen: null, clearLastSeen: jest.fn() }}>
					<MessageRow item={item} previousItem={undefined as any} onLongPress={jest.fn()} />
				</RoomScreenContext.Provider>
			</RoomStoreContext.Provider>
		);
		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ threadBadgeColor: undefined }));
		mockMessage.mockClear();

		sub.tunread = ['other-thread'];
		sub.tunreadUser = ['other-thread'];
		sub.tunreadGroup = ['other-thread'];
		act(() => emit(sub));
		expect(mockMessage).not.toHaveBeenCalled();

		sub.tunread = ['other-thread', item.id];
		act(() => emit(sub));
		expect(mockMessage).toHaveBeenCalledTimes(1);
		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ threadBadgeColor: expect.any(String) }));

		sub.tunread = ['other-thread'];
		act(() => emit(sub));
		expect(mockMessage).toHaveBeenCalledTimes(2);
		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ threadBadgeColor: undefined }));
		cleanup();
	});
});

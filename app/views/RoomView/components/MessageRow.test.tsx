import { InteractionManager } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';

import database from '../../../lib/database';
import { useRoomStoreForScreen, warmRoomStore } from '../stores/RoomStore';
import { RoomScreenContext } from '../stores/RoomScreenContext';
import { RoomStoreContext } from '../../../lib/store/RoomStoreContext';
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
	let emit: ((rows: any[]) => void) | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: (rows: any[]) => void) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return { emit: (rows: any[]) => emit?.(rows) };
};

describe('MessageRow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
			cb();
			return { then: () => {} };
		}) as unknown as typeof InteractionManager.runAfterInteractions);
	});

	// Isolate cases through the public screen-lifetime hook instead of a test-only registry reset.
	afterEach(() => {
		setupObserve();
		renderHook(() => useRoomStoreForScreen({ rid: 'rid-1', initialRoom: { rid: 'rid-1', t: 'c' } })).unmount();
	});

	it('re-renders with fresh isIgnored when the same room instance re-emits a mutated ignored list', () => {
		const { emit } = setupObserve();
		const sub: any = { id: 'sub-1', rid: 'rid-1', t: 'c', ignored: [] };
		const item: any = { id: 'msg-1', ts: new Date('2024-01-01T10:00:00Z'), u: { _id: 'author-1' } };
		const store = warmRoomStore({ rid: 'rid-1', t: 'c', initialRoom: sub });

		render(
			<RoomStoreContext.Provider value={store}>
				<RoomScreenContext.Provider
					value={{ loading: false, failed: false, retry: jest.fn(), lastSeen: null, clearLastSeen: jest.fn() }}>
					<MessageRow item={item} previousItem={undefined as any} onLongPress={jest.fn()} />
				</RoomScreenContext.Provider>
			</RoomStoreContext.Provider>
		);

		act(() => emit([sub]));
		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ isIgnored: false }));

		// Same instance, same ref — mirrors WatermelonDB's mutate-in-place re-emit.
		sub.ignored = ['author-1'];
		act(() => emit([sub]));

		expect(mockMessage).toHaveBeenLastCalledWith(expect.objectContaining({ isIgnored: true }));
	});
});

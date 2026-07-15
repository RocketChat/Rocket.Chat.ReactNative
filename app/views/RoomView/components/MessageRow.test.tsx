import { act, render } from '@testing-library/react-native';

import database from '../../../lib/database';
import { getOrCreateRoomStore, releaseRoomStore } from '../stores/RoomStore';
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
	});

	// Release the 'rid-1' store the case acquires, isolating via the public API (no test-only reset).
	afterEach(() => {
		releaseRoomStore('rid-1');
	});

	it('re-renders with fresh isIgnored when the same room instance re-emits a mutated ignored list', () => {
		const { emit } = setupObserve();
		const sub: any = { id: 'sub-1', rid: 'rid-1', t: 'c', ignored: [] };
		const item: any = { id: 'msg-1', ts: new Date('2024-01-01T10:00:00Z'), u: { _id: 'author-1' } };
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: sub });

		render(
			<RoomStoreContext.Provider value={store}>
				<MessageRow item={item} previousItem={undefined as any} onLongPress={jest.fn()} />
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

import { act, render, renderHook } from '@testing-library/react-native';
import { memo } from 'react';

import database from '../../../../lib/database';
import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import { useHeader } from '../../hooks/useHeader';
import { ComposerProvider, useComposerRoom, useIsAutocompleteVisible, useUpdateAutocompleteVisible } from '../ComposerStore';
import { createRoomStore, observeRoom } from '../RoomStore';
import { RoomStoreContext, useRoomFromStore, useRoomReadFromStore } from '../RoomStoreContext';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../../containers/RoomHeader', () => ({ __esModule: true, default: 'RoomHeader' }));
jest.mock('../../components/LeftButtons', () => ({ __esModule: true, default: 'LeftButtons' }));
jest.mock('../../components/RightButtons/RightButtons', () => ({ __esModule: true, default: 'RightButtons' }));
jest.mock('../../hooks/useGoRoomActionsView', () => ({ useGoRoomActionsView: jest.fn(() => mockGoRoomActionsView) }));
jest.mock('../../../../lib/methods/helpers', () => ({
	getRoomTitle: jest.fn(room => room?.name ?? 'Room'),
	isGroupChat: jest.fn(() => false),
	getUidDirectMessage: jest.fn(() => 'user-1'),
	canAutoTranslate: jest.fn(() => false)
}));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/methods/readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../../lib/services/restApi', () => ({ getUserInfo: jest.fn() }));
jest.mock('../../services/getMessages', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
jest.mock('../../services/joinRoom', () => ({ joinRoom: jest.fn(), resumeRoom: jest.fn() }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => mockNavigation }));

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions };
const mockGoRoomActionsView = jest.fn();
const mockGet = database.active.get as jest.Mock;

type Room = {
	rid: string;
	t: string;
	name?: string;
	topic?: string;
	id?: string;
	status?: string;
	inviter?: string;
	[key: string]: any;
};

const setupDatabase = () => {
	const callbacks = new Set<(rows: Room[]) => void>();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (callback: (rows: Room[]) => void) => {
			callbacks.add(callback);
			return { unsubscribe: jest.fn(() => callbacks.delete(callback)) };
		}
	}));
	mockGet.mockReturnValue({ query: jest.fn(() => ({ observeWithColumns })) });
	return { emit: (rows: Room[]) => callbacks.forEach(callback => callback(rows)) };
};

const preview = (overrides: Partial<Room> = {}): Room => ({ rid: 'rid-1', t: 'c', name: 'general', ...overrides });
const subscription = (overrides: Partial<Room> = {}): Room => ({ id: 'sub-1', ...preview(), ...overrides });

describe('observed Room reads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('propagates a same-instance tracked mutation through the actual store and header', () => {
		const { emit } = setupDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);

		renderHook(() => useHeader({ rid: 'rid-1', roomStore: store }));
		const room = subscription({ name: 'old', topic: 'before' });
		act(() => emit([room]));
		const firstTitleCount = mockSetOptions.mock.calls.length;
		expect(mockSetOptions.mock.calls.at(-1)[0].headerTitle().props).toMatchObject({ title: 'old', subtitle: 'before' });

		act(() => {
			room.name = 'new';
			room.topic = 'after';
			emit([room]);
		});

		expect(mockSetOptions.mock.calls.length).toBe(firstTitleCount + 1);
		expect(mockSetOptions.mock.calls.at(-1)[0].headerTitle().props).toMatchObject({ title: 'new', subtitle: 'after' });
	});

	it('keeps the thread title while updating the parent Room title', () => {
		const { emit } = setupDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		renderHook(() => useHeader({ rid: 'rid-1', tmid: 'tmid-1', name: 'Thread', roomStore: store }));

		const room = subscription({ name: 'parent-before' });
		act(() => emit([room]));
		expect(mockSetOptions.mock.calls.at(-1)[0].headerTitle().props).toMatchObject({
			title: 'Thread',
			parentTitle: 'parent-before'
		});
		act(() => {
			room.name = 'parent-after';
			emit([room]);
		});
		expect(mockSetOptions.mock.calls.at(-1)[0].headerTitle().props).toMatchObject({
			title: 'Thread',
			parentTitle: 'parent-after'
		});
	});

	it('skips no-op and untracked mutations but propagates replacement rows', () => {
		const { emit } = setupDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		renderHook(() => useHeader({ rid: 'rid-1', roomStore: store }));
		const room = subscription({ name: 'same' });
		act(() => emit([room]));
		const afterInitial = mockSetOptions.mock.calls.length;
		act(() => emit([room]));
		expect(mockSetOptions).toHaveBeenCalledTimes(afterInitial);
		act(() => {
			room.lastMessage = { msg: 'untracked' };
			emit([room]);
		});
		expect(mockSetOptions).toHaveBeenCalledTimes(afterInitial);
		const replacement = { ...room };
		act(() => emit([replacement]));
		expect(mockSetOptions).toHaveBeenCalledTimes(afterInitial + 1);
	});

	it('filters changed Room references through ComposerProvider and retains local autocomplete state', () => {
		const room = subscription({ name: 'before' });
		const { emit } = setupDatabase();
		const roomStore = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', roomStore);
		const probe = jest.fn();
		let updateAutocomplete: ReturnType<typeof useUpdateAutocompleteVisible> | undefined;
		const Probe = memo(() => {
			updateAutocomplete = useUpdateAutocompleteVisible();
			probe(useComposerRoom()?.name, useIsAutocompleteVisible());
			return null;
		});
		const Bridge = () => (
			<ComposerProvider rid='rid-1' t='c' roomRead={useRoomReadFromStore(roomStore)}>
				<Probe />
			</ComposerProvider>
		);
		render(
			<RoomStoreContext.Provider value={roomStore}>
				<Bridge />
			</RoomStoreContext.Provider>
		);
		act(() => emit([room]));
		act(() => updateAutocomplete?.(true));
		act(() => {
			room.name = 'after';
			emit([room]);
		});
		expect(probe).toHaveBeenLastCalledWith('after', true);
	});

	it('keeps observation cleanup isolated for two screens sharing a Room id', () => {
		const first = setupDatabase();
		const storeA = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		const storeB = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		const cleanupA = observeRoom('rid-1', storeA);
		const cleanupB = observeRoom('rid-1', storeB);
		const room = subscription({ name: 'shared' });
		first.emit([room]);
		expect(storeA.getState().room.room).toBe(room);
		expect(storeB.getState().room.room).toBe(room);
		cleanupA();
		const replacement = subscription({ id: 'sub-2', name: 'replacement' });
		first.emit([replacement]);
		expect(storeA.getState().room.room).toBe(room);
		expect(storeB.getState().room.room).toBe(replacement);
		cleanupB();
	});

	it('preserves membership transitions, DM no-row behavior, and invite classification', () => {
		const { emit } = setupDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		emit([]);
		expect(store.getState()).toMatchObject({ subscribed: false, joined: false });
		const invited = subscription({ status: 'INVITED', inviter: 'owner' });
		const membership = renderHook(
			() => {
				const room = useRoomFromStore(store);
				return 'id' in room && isInviteSubscription(room as any);
			},
			{ wrapper: ({ children }) => <RoomStoreContext.Provider value={store}>{children}</RoomStoreContext.Provider> }
		);
		act(() => emit([invited]));
		expect(store.getState()).toMatchObject({ subscribed: true, joined: true });
		expect(membership.result.current).toBe(true);
		act(() => emit([]));
		expect(store.getState()).toMatchObject({ subscribed: false, joined: false });
		expect(store.getState().room.room).toBe(invited);
		invited.status = 'OPEN';
		act(() => emit([invited]));
		expect((store.getState().room.room as Room).status).toBe('OPEN');
		expect(membership.result.current).toBe(false);
		const dmStore = createRoomStore({ rid: 'dm-1', initialRoom: preview({ rid: 'dm-1', t: 'd' }) });
		const dmObservation = setupDatabase();
		observeRoom('dm-1', dmStore);
		dmObservation.emit([]);
		expect(dmStore.getState()).toMatchObject({ subscribed: false, joined: true });
	});
});

import { act, render, renderHook } from '@testing-library/react-native';
import { memo } from 'react';

import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import { useHeader } from '../../hooks/useHeader';
import { MessageRow } from '../../components/MessageRow';
import { useReadOnly } from '../../hooks/useReadOnly';
import {
	ComposerProvider,
	useComposerRoom,
	useIsAutocompleteVisible,
	useUpdateAutocompleteVisible
} from '../../../../containers/MessageComposer/ComposerStore';
import { createRoomStore, observeRoom } from '../RoomStore';
import { RoomStoreContext, useRoomFromStore } from '../RoomStoreContext';
import { setupObserveRoomDatabase } from './observeRoomHarness';

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
jest.mock('../../../../containers/message', () => ({
	__esModule: true,
	default: ({ isIgnored }: { isIgnored: boolean }) => {
		mockRenderMessage(isIgnored);
		return null;
	}
}));
jest.mock('../../LoadMore', () => ({ __esModule: true, default: 'LoadMore' }));
jest.mock('../../hooks/useThreadBadgeColor', () => ({ useThreadBadgeColor: () => undefined }));
jest.mock('../RoomScreenContext', () => ({ useRoomScreen: () => ({ lastSeen: null }) }));
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) => selector(mockReduxState)
}));

const mockSetOptions = jest.fn();
const mockNavigation = { setOptions: mockSetOptions };
const mockGoRoomActionsView = jest.fn();
const mockRenderMessage = jest.fn();
const mockReduxState = {
	login: { user: { username: 'me', roles: [] } },
	permissions: { 'post-readonly': ['owner'] }
};

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

const preview = (overrides: Partial<Room> = {}): Room => ({ rid: 'rid-1', t: 'c', name: 'general', ...overrides });
const subscription = (overrides: Partial<Room> = {}): Room => ({ id: 'sub-1', ...preview(), ...overrides });

describe('observed Room reads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('propagates a same-instance tracked mutation through the actual store and header', () => {
		const { emit } = setupObserveRoomDatabase();
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

	it('renders a consumer once on Room open and not again on an identical server sync', () => {
		const { emit } = setupObserveRoomDatabase();
		const room = subscription({ name: 'general' });
		const store = createRoomStore({ rid: 'rid-1', initialRoom: room });
		observeRoom('rid-1', store);
		const renderSpy = jest.fn();
		const Reader = memo(() => {
			const { room: observed } = useRoomFromStore(store);
			renderSpy((observed as Room).name);
			return null;
		});
		render(<Reader />);
		expect(renderSpy).toHaveBeenCalledTimes(1);

		act(() => emit([room]));

		expect(renderSpy).toHaveBeenCalledTimes(1);
	});

	it('keeps the thread title while updating the parent Room title', () => {
		const { emit } = setupObserveRoomDatabase();
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
		const { emit } = setupObserveRoomDatabase();
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
		const { emit } = setupObserveRoomDatabase();
		const roomStore = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', roomStore);
		const renderSpy = jest.fn();
		let updateAutocomplete: ReturnType<typeof useUpdateAutocompleteVisible> | undefined;
		const Reader = memo(() => {
			updateAutocomplete = useUpdateAutocompleteVisible();
			renderSpy(useComposerRoom().room.name, useIsAutocompleteVisible());
			return null;
		});
		const Bridge = () => (
			<ComposerProvider rid='rid-1' t='c' roomSnapshot={useRoomFromStore(roomStore).snapshot}>
				<Reader />
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
		expect(renderSpy).toHaveBeenLastCalledWith('after', true);
	});

	it('shows a Message as ignored when the Ignored User list changes on the same instance', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		const room = subscription({ ignored: [] });
		act(() => emit([room]));

		render(
			<RoomStoreContext.Provider value={store}>
				<MessageRow
					item={{ id: 'message-1', ts: new Date(), u: { _id: 'noisy-user' } } as any}
					previousItem={undefined as any}
					onLongPress={jest.fn()}
				/>
			</RoomStoreContext.Provider>
		);
		expect(mockRenderMessage).toHaveBeenLastCalledWith(false);

		act(() => {
			room.ignored = ['noisy-user'];
			emit([room]);
		});

		expect(mockRenderMessage).toHaveBeenLastCalledWith(true);
	});

	it('lifts the read-only restriction when the Room roles change on the same instance', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		const room = subscription({ ro: true, roles: [] });
		act(() => emit([room]));

		const readOnly = renderHook(() => useReadOnly(), {
			wrapper: ({ children }) => <RoomStoreContext.Provider value={store}>{children}</RoomStoreContext.Provider>
		});
		expect(readOnly.result.current).toBe(true);

		act(() => {
			room.roles = ['owner'];
			emit([room]);
		});

		expect(readOnly.result.current).toBe(false);
	});

	it('keeps observation cleanup isolated for two screens sharing a Room id', () => {
		const first = setupObserveRoomDatabase();
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
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: preview() });
		observeRoom('rid-1', store);
		emit([]);
		expect(store.getState()).toMatchObject({ subscribed: false, joined: false });
		const invited = subscription({ status: 'INVITED', inviter: 'owner' });
		const membership = renderHook(
			() => {
				const { room } = useRoomFromStore(store);
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
		const dmObservation = setupObserveRoomDatabase();
		observeRoom('dm-1', dmStore);
		dmObservation.emit([]);
		expect(dmStore.getState()).toMatchObject({ subscribed: false, joined: true });
	});
});

import { InteractionManager } from 'react-native';
import { createStore } from 'zustand';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createMessageActionStore } from '../../../../containers/message/stores/MessageActionStore';
import { type RoomState, type RoomStore } from '../../definitions';
import { useRoomInit } from '../useRoomInit';

jest.mock('../../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

interface IRenderRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	roomStore: RoomStore;
	roomUpdate: { status?: string };
	onThreadMessagesLoaded: () => void;
	messageActionStore: ReturnType<typeof createMessageActionStore>;
	onQuoteInit: (messageId: string) => void;
}

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		init: jest.fn(() => Promise.resolve(null)),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

// A store whose init() only resolves when the test says so, so an in-flight init can be observed.
const makeDeferredRoomStore = () => {
	const resolvers: ((lastSeen: Date | null) => void)[] = [];
	const roomStore = makeRoomStore();
	roomStore.setState({
		init: jest.fn(
			() =>
				new Promise<Date | null>(resolve => {
					resolvers.push(resolve);
				})
		)
	});
	return {
		roomStore,
		resolveInit: async (call = 0, lastSeen: Date | null = null) => {
			await act(async () => resolvers[call](lastSeen));
		}
	};
};

const renderRoomInit = (overrides: Partial<IRenderRoomInitParams> = {}, roomStore = makeRoomStore()) => {
	const defaultProps: IRenderRoomInitParams = {
		rid: 'rid-1',
		tmid: undefined,
		isAuthenticated: true,
		roomStore,
		roomUpdate: {},
		onThreadMessagesLoaded: jest.fn(),
		messageActionStore: createMessageActionStore(),
		onQuoteInit: jest.fn(),
		...overrides
	};
	const { rerender, result, unmount } = renderHook((props: IRenderRoomInitParams) => useRoomInit(props), {
		initialProps: defaultProps
	});

	return {
		roomStore,
		result,
		unmount,
		rerender: (next: Partial<IRenderRoomInitParams> = {}) => rerender({ ...defaultProps, ...next })
	};
};

describe('useRoomInit', () => {
	let runAfterInteractionsSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
			task();
			return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as any;
		});
	});

	afterEach(() => {
		runAfterInteractionsSpy.mockRestore();
	});

	it('initializes the room store on mount when rid and isAuthenticated are set', () => {
		const roomStore = makeRoomStore();
		renderRoomInit({}, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);
		expect(roomStore.getState().init).toHaveBeenCalledWith(expect.objectContaining({ tmid: undefined }));
	});

	it('does not initialize the room store when not authenticated', () => {
		const roomStore = makeRoomStore();
		renderRoomInit({ isAuthenticated: false }, roomStore);

		expect(roomStore.getState().init).not.toHaveBeenCalled();
	});

	it('re-initializes the room store when the room transitions out of INVITED status', () => {
		const roomStore = makeRoomStore();
		const { rerender } = renderRoomInit({ roomUpdate: { status: 'INVITED' } }, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);

		rerender({ roomUpdate: { status: 'READY' } });

		expect(roomStore.getState().init).toHaveBeenCalledTimes(2);
	});

	it('does not re-initialize the room store when the status changes without having been INVITED', () => {
		const roomStore = makeRoomStore();
		const { rerender } = renderRoomInit({ roomUpdate: { status: 'READY' } }, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);

		rerender({ roomUpdate: { status: 'ANOTHER' } });

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);
	});

	it('fires onQuoteInit once on mount when the message action store has a single-message quote action', () => {
		const onQuoteInit = jest.fn();
		const messageActionStore = createMessageActionStore({ kind: 'quote', messageIds: ['msg-1'] });
		renderRoomInit({ onQuoteInit, messageActionStore });

		expect(onQuoteInit).toHaveBeenCalledTimes(1);
		expect(onQuoteInit).toHaveBeenCalledWith('msg-1');
	});

	it('does not fire onQuoteInit when there is no pending quote action', () => {
		const onQuoteInit = jest.fn();
		renderRoomInit({ onQuoteInit, messageActionStore: createMessageActionStore() });

		expect(onQuoteInit).not.toHaveBeenCalled();
	});

	// init() resolves on the invite early-return and on failure alike, so both land here: the footer
	// must not stay stuck in a loading state on either path.
	it.each([
		['resolves', () => Promise.resolve(null)],
		['rejects', () => Promise.reject(new Error('boom'))]
	])('clears loading once init %s', async (_case, init) => {
		const roomStore = makeRoomStore();
		roomStore.setState({ init: jest.fn(init) });
		const { result } = renderRoomInit({}, roomStore);

		await waitFor(() => expect(result.current.loading).toBe(false));
	});

	it('keeps loading true while init is in flight', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		expect(result.current.loading).toBe(true);

		await resolveInit();

		expect(result.current.loading).toBe(false);
	});

	it('keeps the lastSeen returned by init and clears it on demand', async () => {
		const lastSeen = new Date('2026-01-01T00:00:00.000Z');
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		await resolveInit(0, lastSeen);

		expect(result.current.lastSeen).toBe(lastSeen);

		act(() => result.current.clearLastSeen());

		expect(result.current.lastSeen).toBeNull();
	});

	it('does not clear loading after unmount', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result, unmount } = renderRoomInit({}, roomStore);

		unmount();
		await resolveInit();

		expect(result.current.loading).toBe(true);
	});
});

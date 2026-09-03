import { InteractionManager } from 'react-native';
import { createStore } from 'zustand';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type RoomState, type RoomStore, type TRoomInitResult } from '../../definitions';
import { useRoomInit } from '../useRoomInit';

jest.mock('../../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

interface IRenderRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	roomStore: RoomStore;
	onThreadMessagesLoaded: () => void;
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
		lastMessageFromAgent: false,
		init: jest.fn(() => Promise.resolve<TRoomInitResult>({ status: 'loaded', lastSeen: null })),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

// A store whose init() only resolves when the test says so, so an in-flight init can be observed.
const makeDeferredRoomStore = () => {
	const resolvers: ((result: TRoomInitResult) => void)[] = [];
	const roomStore = makeRoomStore();
	roomStore.setState({
		init: jest.fn(
			() =>
				new Promise<TRoomInitResult>(resolve => {
					resolvers.push(resolve);
				})
		)
	});
	return {
		roomStore,
		resolveInit: async (call = 0, lastSeen: Date | null = null) => {
			await act(async () => resolvers[call]({ status: 'loaded', lastSeen }));
		},
		resolveInitWith: async (call: number, result: TRoomInitResult) => {
			await act(async () => resolvers[call](result));
		}
	};
};

const renderRoomInit = (overrides: Partial<IRenderRoomInitParams> = {}, roomStore = makeRoomStore()) => {
	const defaultProps: IRenderRoomInitParams = {
		rid: 'rid-1',
		tmid: undefined,
		isAuthenticated: true,
		roomStore,
		onThreadMessagesLoaded: jest.fn(),
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

	it('clears loading once init rejects', async () => {
		const roomStore = makeRoomStore();
		roomStore.setState({ init: jest.fn(() => Promise.reject(new Error('boom'))) });
		const { result } = renderRoomInit({}, roomStore);

		await waitFor(() => expect(result.current.loading).toBe(false));
	});

	// A screen with no init run to wait on is idle, not loading: `loading` is derived from having work
	// AND that work being unsettled, so the Join/Resume button can never be stuck disabled.
	it.each([
		['there is no rid', { rid: undefined }],
		['the user is not authenticated', { isAuthenticated: false }]
	])('does not report loading when %s', (_case, overrides) => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomInit(overrides, roomStore);

		expect(roomStore.getState().init).not.toHaveBeenCalled();
		expect(result.current.loading).toBe(false);
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

	// Each run owns its own cancel token, so a superseded run that resolves late is inert: only the
	// run that replaced it may write lastSeen and clear loading.
	it('ignores a superseded init run that resolves after a later one started', async () => {
		const stale = new Date('2026-01-01T00:00:00.000Z');
		const fresh = new Date('2026-02-02T00:00:00.000Z');
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		// retry starts a second run while the mount run is still in flight.
		await act(async () => {
			result.current.retry();
		});
		expect(roomStore.getState().init).toHaveBeenCalledTimes(2);

		await resolveInit(0, stale);

		expect(result.current.loading).toBe(true);
		expect(result.current.lastSeen).toBeNull();

		await resolveInit(1, fresh);

		expect(result.current.lastSeen).toBe(fresh);
		expect(result.current.loading).toBe(false);
	});

	it.each([['failed'], ['skipped']] as const)('leaves lastSeen untouched when init reports %s', async status => {
		const loaded = new Date('2026-01-01T00:00:00.000Z');
		const { roomStore, resolveInit, resolveInitWith } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		await resolveInit(0, loaded);
		expect(result.current.lastSeen).toBe(loaded);

		await act(async () => {
			result.current.retry();
		});
		await resolveInitWith(1, { status });

		expect(result.current.lastSeen).toBe(loaded);
		expect(result.current.loading).toBe(false);
	});

	it('does not clear loading after unmount', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result, unmount } = renderRoomInit({}, roomStore);

		unmount();
		await resolveInit();

		expect(result.current.loading).toBe(true);
	});

	it('reports failed once a failed run settles', async () => {
		const { roomStore, resolveInitWith } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		expect(result.current.failed).toBe(false);

		await resolveInitWith(0, { status: 'failed' });

		expect(result.current.failed).toBe(true);
		expect(result.current.loading).toBe(false);
	});

	it('clears failed and runs init again on retry', async () => {
		const { roomStore, resolveInitWith, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		await resolveInitWith(0, { status: 'failed' });
		expect(result.current.failed).toBe(true);

		await act(async () => {
			result.current.retry();
		});
		expect(result.current.failed).toBe(false);

		await resolveInit(1);
		expect(result.current.failed).toBe(false);
	});

	it('stops reporting failed once the screen has no init work left', async () => {
		const { roomStore, resolveInitWith } = makeDeferredRoomStore();
		const { result, rerender } = renderRoomInit({}, roomStore);

		await resolveInitWith(0, { status: 'failed' });
		expect(result.current.failed).toBe(true);

		rerender({ isAuthenticated: false });

		expect(result.current.failed).toBe(false);
	});

	it('does not report failed for a skipped run', async () => {
		const { roomStore, resolveInitWith } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);

		await resolveInitWith(0, { status: 'skipped' });

		expect(result.current.failed).toBe(false);
	});
});

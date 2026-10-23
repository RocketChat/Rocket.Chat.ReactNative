import { createStore } from 'zustand';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type RoomState, type RoomStore, type TRoomInitResult } from '~/views/RoomView/definitions';
import { useRoomInit } from '../useRoomInit';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

interface IRenderRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	ready: boolean;
	roomStore: RoomStore;
	onThreadMessagesLoaded: () => void;
}

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c' },
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
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
		ready: true,
		...overrides
	};
	const renders: { rid?: string; loading: boolean }[] = [];
	const { rerender, result, unmount } = renderHook(
		(props: IRenderRoomInitParams) => {
			const roomScreen = useRoomInit(props);
			renders.push({ rid: props.rid, loading: roomScreen.loading });
			return roomScreen;
		},
		{ initialProps: defaultProps }
	);

	return {
		roomStore,
		renders,
		result,
		unmount,
		rerender: (next: Partial<IRenderRoomInitParams> = {}) => rerender({ ...defaultProps, ...next })
	};
};

const runDeferredInit = () => act(() => new Promise(resolve => setImmediate(resolve)));

describe('useRoomInit', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('initializes the room store on mount when rid and isAuthenticated are set', async () => {
		const roomStore = makeRoomStore();
		renderRoomInit({}, roomStore);

		expect(roomStore.getState().init).not.toHaveBeenCalled();
		await runDeferredInit();

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);
		expect(roomStore.getState().init).toHaveBeenCalledWith(expect.objectContaining({ tmid: undefined }));
	});

	it('does not initialize the room store when not authenticated', async () => {
		const roomStore = makeRoomStore();
		renderRoomInit({ isAuthenticated: false }, roomStore);
		await runDeferredInit();

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
	])('does not report loading when %s', async (_case, overrides) => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomInit(overrides, roomStore);
		await runDeferredInit();

		expect(roomStore.getState().init).not.toHaveBeenCalled();
		expect(result.current.loading).toBe(false);
	});

	it('keeps loading true while init is in flight', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);
		await runDeferredInit();

		expect(result.current.loading).toBe(true);

		await resolveInit();

		expect(result.current.loading).toBe(false);
	});

	it('never renders the new rid as loaded before its init run settles', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { renders, rerender } = renderRoomInit({}, roomStore);
		await runDeferredInit();
		await resolveInit();

		rerender({ rid: 'rid-2' });

		const newRidRenders = renders.filter(render => render.rid === 'rid-2');
		expect(newRidRenders.length).toBeGreaterThan(0);
		expect(newRidRenders.every(render => render.loading)).toBe(true);
	});

	it('keeps the lastSeen returned by init and clears it on demand', async () => {
		const lastSeen = new Date('2026-01-01T00:00:00.000Z');
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);
		await runDeferredInit();

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
		const { result, rerender } = renderRoomInit({}, roomStore);
		await runDeferredInit();

		rerender({ isAuthenticated: false });
		rerender({ isAuthenticated: true });
		await runDeferredInit();
		expect(roomStore.getState().init).toHaveBeenCalledTimes(2);

		await resolveInit(0, stale);

		expect(result.current.loading).toBe(true);
		expect(result.current.lastSeen).toBeNull();

		await resolveInit(1, fresh);

		expect(result.current.lastSeen).toBe(fresh);
		expect(result.current.loading).toBe(false);
	});

	it('stops loading when the first init run does not load the room', async () => {
		const { roomStore, resolveInitWith } = makeDeferredRoomStore();
		const { result } = renderRoomInit({}, roomStore);
		await runDeferredInit();

		await resolveInitWith(0, { status: 'skipped' });

		expect(result.current.loading).toBe(false);
		expect(result.current.lastSeen).toBeNull();
	});

	it('stops loading when init throws', async () => {
		const roomStore = makeRoomStore();
		roomStore.setState({ init: jest.fn(() => Promise.reject(new Error('init failed'))) });
		const { result } = renderRoomInit({}, roomStore);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.lastSeen).toBeNull();
	});

	it('leaves lastSeen untouched when a later init run does not load the room', async () => {
		const loaded = new Date('2026-01-01T00:00:00.000Z');
		const { roomStore, resolveInit, resolveInitWith } = makeDeferredRoomStore();
		const { result, rerender } = renderRoomInit({}, roomStore);
		await runDeferredInit();

		await resolveInit(0, loaded);
		expect(result.current.lastSeen).toBe(loaded);

		rerender({ isAuthenticated: false });
		rerender({ isAuthenticated: true });
		await runDeferredInit();
		await resolveInitWith(1, { status: 'skipped' });

		expect(result.current.lastSeen).toBe(loaded);
		expect(result.current.loading).toBe(false);
	});

	it('does not clear loading after unmount', async () => {
		const { roomStore, resolveInit } = makeDeferredRoomStore();
		const { result, unmount } = renderRoomInit({}, roomStore);
		await runDeferredInit();

		unmount();
		await resolveInit();

		expect(result.current.loading).toBe(true);
	});
});

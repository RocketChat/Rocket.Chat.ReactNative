import { InteractionManager } from 'react-native';
import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import { createMessageActionStore } from '../../../../containers/message/stores/MessageActionStore';
import { type RoomState, type RoomStore } from '../../definitions';
import { useRoomInit } from '../useRoomInit';

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
		loading: false,
		lastOpen: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		init: jest.fn(() => Promise.resolve()),
		join: jest.fn(),
		markMessageSent: jest.fn()
	}));

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
	const { rerender } = renderHook((props: IRenderRoomInitParams) => useRoomInit(props), { initialProps: defaultProps });

	return {
		roomStore,
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
});

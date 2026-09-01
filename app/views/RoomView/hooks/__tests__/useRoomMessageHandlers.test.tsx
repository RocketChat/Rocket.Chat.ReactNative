import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { toggleFollowMessage } from '../../../../lib/services/restApi';
import { replyBroadcast as replyBroadcastAction } from '../../../../actions/messages';
import { type RoomState, type RoomStore, type IUseRoomMessageHandlersParams } from '../../definitions';
import { RoomStoreContext } from '../../stores/RoomStoreContext';
import { MessageRoomProvider } from '../../../../containers/message/stores/MessageRoomStore';
import { useRoomMessageHandlers } from '../useRoomMessageHandlers';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch
}));
jest.mock('../../../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: jest.fn(() => false)
}));
jest.mock('../../../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: mockHideActionSheet })
}));
jest.mock('../../../../lib/services/restApi', () => ({
	toggleFollowMessage: jest.fn()
}));
jest.mock('../../../../actions/messages', () => ({
	replyBroadcast: jest.fn(message => ({ type: 'REPLY_BROADCAST', payload: message }))
}));
jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn(() => Promise.resolve(null))
}));
jest.mock('../../../../lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread Title'))
}));

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
const mockDispatch = jest.fn();
const mockShowActionSheet = jest.fn();
const mockHideActionSheet = jest.fn();

const mockToggleFollowMessage = toggleFollowMessage as jest.Mock;
const mockReplyBroadcastAction = replyBroadcastAction as jest.Mock;

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c', name: 'general' },
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
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve()),
		...overrides
	}));

const makeScreenHandlers = (overrides: Partial<IUseRoomMessageHandlersParams> = {}): IUseRoomMessageHandlersParams => ({
	onThreadPress: jest.fn(),
	onReactionPress: jest.fn(() => Promise.resolve()),
	onAnswerButtonPress: jest.fn(),
	...overrides
});

const renderRoomMessageHandlers = (
	roomStoreOverrides: Partial<RoomState> = {},
	tmid?: string,
	screenHandlers: IUseRoomMessageHandlersParams = makeScreenHandlers()
) => {
	const roomStore = makeRoomStore(roomStoreOverrides);

	const { result } = renderHook(() => useRoomMessageHandlers(screenHandlers), {
		wrapper: ({ children }) => (
			<RoomStoreContext.Provider value={roomStore}>
				<MessageRoomProvider tmid={tmid} timeFormat='h:mm A'>
					{children}
				</MessageRoomProvider>
			</RoomStoreContext.Provider>
		)
	});

	return { result, roomStore, screenHandlers };
};

// MessageRoomProvider stays mounted (useRoomTmid throws without it); the room store context is the one left absent.
const renderWithoutStores = () =>
	renderHook(() => useRoomMessageHandlers(makeScreenHandlers()), {
		wrapper: ({ children }) => <MessageRoomProvider timeFormat='h:mm A'>{children}</MessageRoomProvider>
	});

describe('useRoomMessageHandlers', () => {
	beforeEach(() => jest.clearAllMocks());

	describe('handlers owned by the room screen', () => {
		it('publishes the screen onThreadPress rather than opening the thread itself', () => {
			const screenHandlers = makeScreenHandlers();
			const { result } = renderRoomMessageHandlers({}, undefined, screenHandlers);
			const item = { id: 'msg-1' } as any;

			act(() => result.current.onThreadPress(item));

			expect(screenHandlers.onThreadPress).toHaveBeenCalledWith(item);
			expect(mockNavigation.push).not.toHaveBeenCalled();
		});

		it('publishes the screen onReactionPress and onAnswerButtonPress', async () => {
			const screenHandlers = makeScreenHandlers();
			const { result } = renderRoomMessageHandlers({}, undefined, screenHandlers);

			await act(async () => {
				await result.current.onReactionPress('smile' as any, 'msg-1');
				result.current.onAnswerButtonPress('hello', true);
			});

			expect(screenHandlers.onReactionPress).toHaveBeenCalledWith('smile', 'msg-1');
			expect(screenHandlers.onAnswerButtonPress).toHaveBeenCalledWith('hello', true);
		});
	});

	describe('replyBroadcast', () => {
		it('dispatches the replyBroadcast action for the message', () => {
			const message = { id: 'msg-1' } as any;
			const { result } = renderRoomMessageHandlers();

			act(() => result.current.replyBroadcast(message));

			expect(mockReplyBroadcastAction).toHaveBeenCalledWith(message);
			expect(mockDispatch).toHaveBeenCalledWith({ type: 'REPLY_BROADCAST', payload: message });
		});
	});

	describe('toggleFollowThread', () => {
		it('falls back to the room store tmid when no threadId is given', async () => {
			mockToggleFollowMessage.mockResolvedValue(undefined);
			const { result } = renderRoomMessageHandlers({}, 'thread-from-store');

			await act(async () => {
				await result.current.toggleFollowThread(false);
			});

			expect(mockToggleFollowMessage).toHaveBeenCalledWith('thread-from-store', true);
		});

		it('prefers an explicit threadId over the room store tmid', async () => {
			mockToggleFollowMessage.mockResolvedValue(undefined);
			const { result } = renderRoomMessageHandlers({}, 'thread-from-store');

			await act(async () => {
				await result.current.toggleFollowThread(true, 'explicit-thread');
			});

			expect(mockToggleFollowMessage).toHaveBeenCalledWith('explicit-thread', false);
		});

		it('no-ops when neither an explicit threadId nor a store tmid is available', async () => {
			const { result } = renderRoomMessageHandlers();

			await act(async () => {
				await result.current.toggleFollowThread(false);
			});

			expect(mockToggleFollowMessage).not.toHaveBeenCalled();
		});
	});

	describe('store contexts absent', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('throws when the room store context is absent', () => {
			expect(() => renderWithoutStores()).toThrow(/must be used within a RoomStoreContext\.Provider/);
		});
	});
});

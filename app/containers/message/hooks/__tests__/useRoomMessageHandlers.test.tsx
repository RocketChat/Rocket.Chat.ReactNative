import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { setReaction, toggleFollowMessage } from '../../../../lib/services/restApi';
import { replyBroadcast as replyBroadcastAction } from '../../../../actions/messages';
import log from '../../../../lib/methods/helpers/log';
import { Review } from '../../../../lib/methods/helpers/review';
import { sendMessage } from '../../../../lib/methods/sendMessage';
import { getUserSelector } from '../../../../selectors/login';
import { type RoomState, type RoomStore } from '../../../../views/RoomView/stores/RoomStore';
import { RoomStoreContext } from '../../../../views/RoomView/stores/RoomStoreContext';
import { createMessageActionStore, MessageActionStoreContext } from '../../stores/MessageActionStore';
import { MessageRoomProvider } from '../../stores/MessageRoomStore';
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
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));
jest.mock('../../../ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: mockHideActionSheet })
}));
jest.mock('../../../../lib/methods/helpers', () => ({
	useDebounce: (fn: (...args: any[]) => any) => fn
}));
jest.mock('../../../../lib/services/restApi', () => ({
	setReaction: jest.fn(),
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
jest.mock('../../../../lib/methods/helpers/review', () => ({
	Review: { pushPositiveEvent: jest.fn() }
}));
jest.mock('../../../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn(() => Promise.resolve())
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

const mockSetReaction = setReaction as jest.Mock;
const mockToggleFollowMessage = toggleFollowMessage as jest.Mock;
const mockReplyBroadcastAction = replyBroadcastAction as jest.Mock;
const mockLog = log as jest.Mock;
const mockSendMessage = sendMessage as jest.Mock;

const mockUser = { id: 'u1', username: 'user', token: 'tok', showMessageInMainThread: false };

const { useAppSelector } = jest.requireMock('../../../../lib/hooks/useAppSelector');

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c', name: 'general' },
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
		init: jest.fn(),
		join: jest.fn(),
		markMessageSent: jest.fn(),
		...overrides
	}));

const renderRoomMessageHandlers = (roomStoreOverrides: Partial<RoomState> = {}, tmid?: string) => {
	const roomStore = makeRoomStore(roomStoreOverrides);
	const messageActionStore = createMessageActionStore();

	const { result } = renderHook(() => useRoomMessageHandlers(), {
		wrapper: ({ children }) => (
			<RoomStoreContext.Provider value={roomStore}>
				<MessageActionStoreContext.Provider value={messageActionStore}>
					<MessageRoomProvider tmid={tmid} timeFormat='h:mm A'>
						{children}
					</MessageRoomProvider>
				</MessageActionStoreContext.Provider>
			</RoomStoreContext.Provider>
		)
	});

	return { result, roomStore, messageActionStore };
};

// MessageRoomProvider stays mounted (useRoomTmid throws without it); the store contexts are the ones left absent.
const renderWithoutStores = (options?: { optional?: boolean }) =>
	renderHook(() => useRoomMessageHandlers(options as { optional: true }), {
		wrapper: ({ children }) => <MessageRoomProvider timeFormat='h:mm A'>{children}</MessageRoomProvider>
	});

describe('useRoomMessageHandlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useAppSelector.mockImplementation((selector: any) => (selector === getUserSelector ? mockUser : undefined));
	});

	describe('onReactionPress', () => {
		it('sets the reaction, closes the action sheet and reports a positive review event', async () => {
			mockSetReaction.mockResolvedValue(undefined);
			const { result, messageActionStore } = renderRoomMessageHandlers();
			messageActionStore.getState().actions.startReacting('msg-1');

			await act(async () => {
				await result.current.onReactionPress({ name: 'smile' } as any, 'msg-1');
			});

			expect(mockSetReaction).toHaveBeenCalledWith('smile', 'msg-1');
			expect(mockHideActionSheet).toHaveBeenCalledTimes(1);
			expect(messageActionStore.getState().action).toBeNull();
			expect(Review.pushPositiveEvent).toHaveBeenCalledTimes(1);
		});

		it('logs the error and skips the review event when setReaction rejects', async () => {
			const error = new Error('boom');
			mockSetReaction.mockRejectedValue(error);
			const { result } = renderRoomMessageHandlers();

			await act(async () => {
				await result.current.onReactionPress('smile', 'msg-1');
			});

			expect(mockLog).toHaveBeenCalledWith(error);
			expect(mockHideActionSheet).not.toHaveBeenCalled();
			expect(Review.pushPositiveEvent).not.toHaveBeenCalled();
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
	});

	describe('onAnswerButtonPress', () => {
		it('sends the message, marks it sent and reports a positive review event', async () => {
			mockSendMessage.mockResolvedValue(undefined);
			const { result, roomStore, messageActionStore } = renderRoomMessageHandlers({}, 'thread-1');
			messageActionStore.getState().actions.startEditing('msg-1');
			const markMessageSentSpy = roomStore.getState().markMessageSent as jest.Mock;

			await act(async () => {
				result.current.onAnswerButtonPress('hello', true);
				await Promise.resolve();
			});

			expect(mockSendMessage).toHaveBeenCalledWith('rid-1', 'hello', 'thread-1', mockUser, true);
			expect(markMessageSentSpy).toHaveBeenCalledTimes(1);
			expect(Review.pushPositiveEvent).toHaveBeenCalledTimes(1);
			expect(messageActionStore.getState().action).toBeNull();
		});

		it('no-ops when the message is undefined', () => {
			const { result } = renderRoomMessageHandlers();

			act(() => result.current.onAnswerButtonPress(undefined));

			expect(mockSendMessage).not.toHaveBeenCalled();
		});
	});

	describe('optional mode', () => {
		it('returns undefined without throwing when the store contexts are absent', () => {
			const { result } = renderWithoutStores({ optional: true });

			expect(result.current).toBeUndefined();
		});

		it('throws when the store contexts are absent and optional is omitted', () => {
			expect(() => renderWithoutStores()).toThrow('must be used within a RoomStoreContext.Provider');
		});
	});
});

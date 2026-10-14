import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import getRoomInfo from '~/lib/methods/getRoomInfo';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { showToast } from '~/lib/methods/helpers/showToast';
import { toggleFollowMessage } from '~/lib/services/restApi';
import { replyBroadcast as replyBroadcastAction } from '~/actions/messages';
import { getUserSelector } from '~/selectors/login';
import { type RoomState, type RoomStore } from '~/views/RoomView/definitions';
import { RoomStoreContext } from '~/views/RoomView/stores/RoomStoreContext';
import { useRoomMessageHandlers } from '../useRoomMessageHandlers';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));
jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch
}));
jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: jest.fn(() => false)
}));
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));
jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: mockHideActionSheet })
}));
jest.mock('~/lib/services/restApi', () => ({
	toggleFollowMessage: jest.fn()
}));
jest.mock('~/actions/messages', () => ({
	replyBroadcast: jest.fn(message => ({ type: 'REPLY_BROADCAST', payload: message }))
}));
jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('~/lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('~/lib/methods/getRoomInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('~/lib/methods/helpers/review', () => ({
	Review: { pushPositiveEvent: jest.fn() }
}));
jest.mock('~/lib/methods/sendMessage', () => ({
	sendMessage: jest.fn(() => Promise.resolve())
}));
jest.mock('~/lib/database/services/Thread', () => ({
	getThreadById: jest.fn(() => Promise.resolve(null))
}));
jest.mock('~/lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread Title'))
}));

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
const mockDispatch = jest.fn();
const mockShowActionSheet = jest.fn();
const mockOnThreadPress = jest.fn();
const mockOnReactionPress = jest.fn();
const mockSendRoomMessage = jest.fn();
const mockHideActionSheet = jest.fn();

const mockToggleFollowMessage = toggleFollowMessage as jest.Mock;
const mockReplyBroadcastAction = replyBroadcastAction as jest.Mock;

const mockUser = { id: 'u1', username: 'user', token: 'tok', showMessageInMainThread: false };

const { useAppSelector } = jest.requireMock('~/lib/hooks/useAppSelector');

const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c', name: 'general' },
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve()),
		...overrides
	}));

const renderRoomMessageHandlers = (roomStoreOverrides: Partial<RoomState> = {}, tmid?: string) => {
	const roomStore = makeRoomStore(roomStoreOverrides);

	const { result } = renderHook(
		() =>
			useRoomMessageHandlers({
				tmid,
				onThreadPress: mockOnThreadPress,
				onReactionPress: mockOnReactionPress,
				sendMessage: mockSendRoomMessage
			}),
		{
			wrapper: ({ children }) => <RoomStoreContext.Provider value={roomStore}>{children}</RoomStoreContext.Provider>
		}
	);

	return { result, roomStore };
};

const renderWithoutStores = () =>
	renderHook(() =>
		useRoomMessageHandlers({
			onThreadPress: mockOnThreadPress,
			onReactionPress: mockOnReactionPress,
			sendMessage: jest.fn()
		})
	);

describe('useRoomMessageHandlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useAppSelector.mockImplementation((selector: any) => (selector === getUserSelector ? mockUser : undefined));
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

	describe('onDiscussionPress', () => {
		const mockGetRoomInfo = getRoomInfo as jest.Mock;

		it('opens the discussion room', async () => {
			const discussion = { rid: 'disc1', name: 'disc', t: 'p' };
			mockGetRoomInfo.mockResolvedValue(discussion);
			const { result } = renderRoomMessageHandlers();

			await act(async () => {
				await result.current.onDiscussionPress('disc1');
			});

			expect(mockGetRoomInfo).toHaveBeenCalledWith('disc1');
			expect(goRoom).toHaveBeenCalledWith({ item: discussion, isMasterDetail: false });
		});

		it('opens the discussion only once on a double tap', async () => {
			mockGetRoomInfo.mockResolvedValue({ rid: 'disc1', name: 'disc', t: 'p' });
			const { result } = renderRoomMessageHandlers();

			await act(async () => {
				await Promise.all([result.current.onDiscussionPress('disc1'), result.current.onDiscussionPress('disc1')]);
			});

			expect(mockGetRoomInfo).toHaveBeenCalledTimes(1);
			expect(goRoom).toHaveBeenCalledTimes(1);
		});

		it('shows a toast when the discussion cannot be resolved', async () => {
			mockGetRoomInfo.mockResolvedValue(null);
			const { result } = renderRoomMessageHandlers();

			await act(async () => {
				await result.current.onDiscussionPress('disc1');
			});

			expect(showToast).toHaveBeenCalledWith('Room not found');
			expect(goRoom).not.toHaveBeenCalled();
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

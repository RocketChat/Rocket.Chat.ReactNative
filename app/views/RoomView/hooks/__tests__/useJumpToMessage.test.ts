import { act, renderHook, waitFor } from '@testing-library/react-native';

import { makeThreadName } from '~/lib/methods/helpers/room';
import getRoomInfo from '~/lib/methods/getRoomInfo';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { sendLoadingEvent } from '~/containers/Loading';
import getMessageInfo from '~/views/RoomView/services/getMessageInfo';
import { loadThreadMessagesUntil } from '~/lib/methods/loadThreadMessages';
import { resolveJumpAnchor } from '~/views/RoomView/services/resolveJumpAnchor';
import { useJumpToMessage } from '../useJumpToMessage';
import { type IUseJumpToMessageParams } from '~/views/RoomView/definitions';

const mockNavigation = { navigate: jest.fn(), push: jest.fn(), setParams: jest.fn(), addListener: jest.fn() };
let mockRouteParams: { jumpToMessageId?: string; jumpToThreadId?: string } = {};
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation,
	useRoute: () => ({ params: mockRouteParams })
}));
jest.mock('~/lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Thread Name') }));
jest.mock('~/lib/methods/helpers', () => ({ useDebounce: (fn: (...args: any[]) => any) => fn }));
jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('~/lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('~/lib/methods/getRoomInfo', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve({ rid: 'other-rid' }))
}));
jest.mock('~/views/RoomView/services/getMessageInfo', () => ({
	__esModule: true,
	default: jest.fn()
}));
jest.mock('~/views/RoomView/services/resolveJumpAnchor', () => ({ resolveJumpAnchor: jest.fn(() => Promise.resolve(null)) }));
jest.mock('~/views/RoomView/services/fetchThreadName', () => ({
	fetchThreadName: jest.fn(() => Promise.resolve('Thread Title'))
}));
jest.mock('~/lib/methods/loadThreadMessages', () => ({ loadThreadMessagesUntil: jest.fn(() => Promise.resolve(true)) }));
jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('~/containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));

const mockMakeThreadName = makeThreadName as jest.Mock;
const mockGetRoomInfo = getRoomInfo as jest.Mock;
const mockGoRoom = goRoom as jest.Mock;
const mockGetMessageInfo = getMessageInfo as jest.Mock;
const mockLoadThreadMessagesUntil = loadThreadMessagesUntil as jest.Mock;
const mockResolveJumpAnchor = resolveJumpAnchor as jest.Mock;

const renderRoomNavigation = (overrides: Partial<IUseJumpToMessageParams> = {}) => {
	const { result, unmount } = renderHook(() =>
		useJumpToMessage({
			rid: 'rid-1',
			tmid: undefined,
			t: 'c',
			isMasterDetail: false,
			listContainerRef: { current: null },
			roomUserIdRef: { current: null },
			...overrides
		})
	);

	return { result, navigation: mockNavigation, unmount };
};

describe('useJumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRouteParams = {};
	});

	it('Thread press resolves and pushes a thread name for an item carrying its own tmid', async () => {
		const { result, navigation } = renderRoomNavigation();

		await act(async () => {
			result.current.onThreadPress({ id: 'msg-1', tmid: 'thread-1', tmsg: '' } as any);
			await Promise.resolve();
		});

		expect(sendLoadingEvent).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'thread-1',
			name: 'Thread Title',
			t: 'thread',
			roomUserId: null,
			jumpToMessageId: 'msg-1'
		});
	});

	it('Thread press pushes using makeThreadName when opening a thread from its parent message', async () => {
		const { result, navigation } = renderRoomNavigation();

		await act(async () => {
			result.current.onThreadPress({ id: 'msg-1', tlm: '2024-01-01T00:00:00.000Z' } as any);
			await Promise.resolve();
		});

		expect(mockMakeThreadName).toHaveBeenCalled();
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'msg-1',
			name: 'Thread Name',
			t: 'thread',
			roomUserId: null
		});
	});

	it('Message URL fetches the target room info and opens it, forwarding the jump target', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'other-rid' });
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-1', rid: 'other-rid' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-1');
		});

		expect(mockGetRoomInfo).toHaveBeenCalledWith('other-rid');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'other-rid' }, isMasterDetail: false, jumpToMessageId: 'msg-1' });
	});

	it('leaves the loading overlay to the room it opened when the view closes afterwards', async () => {
		mockGetRoomInfo.mockResolvedValueOnce({ rid: 'other-rid' });
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-1', rid: 'other-rid' });
		const { result, unmount } = renderRoomNavigation();
		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-1');
		});

		unmount();

		expect(sendLoadingEvent).not.toHaveBeenCalledWith({ visible: false });
	});

	it('Message URL navigation is a no-op without a target rid', async () => {
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-1' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-1');
		});

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
	});

	it('jumpToMessageByUrl parses the message id from the url and triggers the jump', async () => {
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-42', rid: 'rid-1' });
		const { result } = renderRoomNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/channel/general?msg=msg-42', true);
		});

		expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-42');
	});

	it('jumpToMessageByUrl is a no-op without a url', async () => {
		const { result } = renderRoomNavigation();

		await result.current.jumpToMessageByUrl(undefined);

		expect(mockGetMessageInfo).not.toHaveBeenCalled();
	});

	describe('jumping inside a thread', () => {
		const MESSAGE_URL = 'https://open.rocket.chat/channel/general?msg=msg-42';
		const THREAD_MESSAGE = { id: 'msg-42', rid: 'rid-1', tmid: 'thread-1' };

		const renderThreadJump = ({ isMessageInWindow, tmid }: { isMessageInWindow: boolean; tmid?: string }) => {
			const list = { isMessageInWindow: jest.fn(() => isMessageInWindow), jumpToMessage: jest.fn(() => Promise.resolve()) };
			const { result, unmount } = renderRoomNavigation({
				tmid,
				t: tmid ? 'thread' : 'c',
				listContainerRef: { current: list as any }
			});
			const jump = (url = MESSAGE_URL) =>
				act(async () => {
					await result.current.jumpToMessageByUrl(url);
				});
			return { jump, list, unmount };
		};

		it('loads the thread until the target thread message is stored before jumping to it', async () => {
			mockGetMessageInfo.mockResolvedValueOnce(THREAD_MESSAGE);
			const { jump, list } = renderThreadJump({ isMessageInWindow: false, tmid: 'thread-1' });

			await jump();

			expect(mockLoadThreadMessagesUntil).toHaveBeenCalledWith(
				{ tmid: 'thread-1', rid: 'rid-1' },
				THREAD_MESSAGE,
				expect.any(Function)
			);
			expect(list.jumpToMessage).toHaveBeenCalledWith('msg-42', null);
		});

		it('does not jump when the target thread message could not be loaded', async () => {
			mockGetMessageInfo.mockResolvedValueOnce(THREAD_MESSAGE);
			mockLoadThreadMessagesUntil.mockResolvedValueOnce(false);
			const { jump, list } = renderThreadJump({ isMessageInWindow: false, tmid: 'thread-1' });

			await jump();

			expect(list.jumpToMessage).not.toHaveBeenCalled();
		});

		it('does not load the thread when the thread message is already in the Message Window', async () => {
			mockGetMessageInfo.mockResolvedValueOnce(THREAD_MESSAGE);
			const { jump, list } = renderThreadJump({ isMessageInWindow: true, tmid: 'thread-1' });

			await jump();

			expect(mockLoadThreadMessagesUntil).not.toHaveBeenCalled();
			expect(list.jumpToMessage).toHaveBeenCalledWith('msg-42', null);
		});

		it('loads the thread before jumping to its thread parent without anchoring the window', async () => {
			mockGetMessageInfo.mockResolvedValueOnce({ id: 'thread-1', rid: 'rid-1' });
			const { jump, list } = renderThreadJump({ isMessageInWindow: false, tmid: 'thread-1' });

			await jump('https://open.rocket.chat/channel/general?msg=thread-1');

			expect(mockLoadThreadMessagesUntil).toHaveBeenCalledWith(
				{ tmid: 'thread-1', rid: 'rid-1' },
				{ id: 'thread-1', rid: 'rid-1' },
				expect.any(Function)
			);
			expect(mockResolveJumpAnchor).not.toHaveBeenCalled();
			expect(list.jumpToMessage).toHaveBeenCalledWith('thread-1', null);
		});

		it('stops wanting the thread loaded once the thread view closes', async () => {
			mockGetMessageInfo.mockResolvedValueOnce(THREAD_MESSAGE);
			let isWanted: () => boolean = () => true;
			mockLoadThreadMessagesUntil.mockImplementationOnce((_thread, _target, wanted: () => boolean) => {
				isWanted = wanted;
				return Promise.resolve(true);
			});
			const { jump, unmount } = renderThreadJump({ isMessageInWindow: false, tmid: 'thread-1' });
			await jump();
			expect(isWanted()).toBe(true);

			unmount();

			expect(isWanted()).toBe(false);
		});

		it('hides the loading overlay when the thread view closes while the thread is loading', async () => {
			mockGetMessageInfo.mockResolvedValueOnce(THREAD_MESSAGE);
			let finishLoading!: (reached: boolean) => void;
			mockLoadThreadMessagesUntil.mockImplementationOnce(
				() =>
					new Promise<boolean>(resolve => {
						finishLoading = resolve;
					})
			);
			const list = {
				isMessageInWindow: jest.fn(() => false),
				jumpToMessage: jest.fn(() => Promise.resolve()),
				cancelJumpToMessage: jest.fn()
			};
			const { result, unmount } = renderRoomNavigation({
				tmid: 'thread-1',
				t: 'thread',
				listContainerRef: { current: list as any }
			});
			const jumping = result.current.jumpToMessageByUrl(MESSAGE_URL);
			await waitFor(() => expect(mockLoadThreadMessagesUntil).toHaveBeenCalled());

			unmount();
			finishLoading(false);
			await jumping;

			expect(sendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		});

		it('does not load thread messages when jumping in the room', async () => {
			mockGetMessageInfo.mockResolvedValueOnce({ id: 'msg-42', rid: 'rid-1' });
			const { jump } = renderThreadJump({ isMessageInWindow: false });

			await jump();

			expect(mockLoadThreadMessagesUntil).not.toHaveBeenCalled();
		});
	});
});

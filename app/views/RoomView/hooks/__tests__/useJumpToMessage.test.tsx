import { InteractionManager } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { sendLoadingEvent } from '../../../../containers/Loading';
import log from '../../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../../lib/methods/loadSurroundingMessages';
import getLocalAnchorTs from '../../services/getLocalAnchor';
import getMessageInfo from '../../services/getMessageInfo';
import { resolveJumpAnchor } from '../../services/resolveJumpAnchor';
import { useJumpToMessage } from '../useJumpToMessage';

jest.mock('../../services/getLocalAnchor', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/getMessageInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/resolveJumpAnchor', () => ({
	resolveJumpAnchor: jest.fn()
}));
jest.mock('../../../../containers/Loading', () => ({
	sendLoadingEvent: jest.fn()
}));
jest.mock('../../../../lib/methods/loadSurroundingMessages', () => ({
	loadSurroundingMessages: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));
jest.mock('../../../../i18n', () => ({
	__esModule: true,
	default: { t: jest.fn((key: string) => key) }
}));

const mockSetParams = jest.fn();
const defaultRouteParams: { jumpToMessageId?: string; jumpToThreadId?: string } = {};
let mockRouteParams = { ...defaultRouteParams };

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setParams: mockSetParams }),
	useRoute: () => ({ params: mockRouteParams })
}));

const mockGetMessageInfo = getMessageInfo as unknown as jest.Mock;
const mockResolveJumpAnchor = resolveJumpAnchor as jest.Mock;
const mockSendLoadingEvent = sendLoadingEvent as jest.Mock;
const mockLog = log as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;

const RID = 'rid-1';

const createListRef = () => ({
	current: {
		isMessageInWindow: jest.fn(),
		jumpToMessage: jest.fn(() => Promise.resolve()),
		cancelJumpToMessage: jest.fn()
	}
});

type TJumpToMessageOverrides = Partial<Parameters<typeof useJumpToMessage>[0]>;

const renderJumpToMessage = (listRef: ReturnType<typeof createListRef>, params: TJumpToMessageOverrides = {}) => {
	const navToRoom = jest.fn();
	const navToThread = jest.fn();
	const { result, rerender } = renderHook(
		(props: TJumpToMessageOverrides) => useJumpToMessage({ rid: RID, listRef, navToRoom, navToThread, ...props }),
		{ initialProps: params }
	);
	return { result, rerender, navToRoom, navToThread };
};

describe('useJumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockResolveJumpAnchor.mockResolvedValue(null);
		mockRouteParams = { ...defaultRouteParams };
	});

	it('jumps in-window: resolves anchor with inWindow=true and calls list.jumpToMessage', async () => {
		const listRef = createListRef();
		listRef.current.isMessageInWindow.mockReturnValue(true);
		mockGetMessageInfo.mockResolvedValue({ id: 'm1', rid: RID, ts: 100 });
		mockResolveJumpAnchor.mockResolvedValue(12345);
		const { result, navToRoom, navToThread } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('m1');
		});

		expect(mockResolveJumpAnchor).toHaveBeenCalledWith(RID, { id: 'm1', tmid: undefined, ts: 100, fromServer: undefined }, true, {
			loadSurroundingMessages,
			getLocalAnchorTs
		});
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('m1', 12345);
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: true, onCancel: result.current.cancelJumpToMessage });
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(navToRoom).not.toHaveBeenCalled();
		expect(navToThread).not.toHaveBeenCalled();
	});

	it('jumps out-of-window: resolves anchor with inWindow=false and calls list.jumpToMessage', async () => {
		const listRef = createListRef();
		listRef.current.isMessageInWindow.mockReturnValue(false);
		mockGetMessageInfo.mockResolvedValue({ id: 'm1', rid: RID, ts: 100 });
		mockResolveJumpAnchor.mockResolvedValue(null);
		const { result } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('m1');
		});

		expect(mockResolveJumpAnchor).toHaveBeenCalledWith(
			RID,
			{ id: 'm1', tmid: undefined, ts: 100, fromServer: undefined },
			false,
			{
				loadSurroundingMessages,
				getLocalAnchorTs
			}
		);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('m1', null);
	});

	it('cancelJumpToMessage cancels the list and hides the loading indicator', () => {
		const listRef = createListRef();
		const { result } = renderJumpToMessage(listRef);

		act(() => {
			result.current.cancelJumpToMessage();
		});

		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: false });
	});

	it('cancels the jump when getMessageInfo resolves to no message', async () => {
		const listRef = createListRef();
		mockGetMessageInfo.mockResolvedValue(null);
		const { result } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('missing');
		});

		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to another room when the target message lives outside the current room/thread', async () => {
		const listRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm2', rid: 'rid-2', ts: 100 });
		const { result, navToRoom, navToThread } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('m2');
		});

		expect(navToRoom).toHaveBeenCalledWith({ id: 'm2', rid: 'rid-2', ts: 100 });
		expect(navToThread).not.toHaveBeenCalled();
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to the thread when the target message belongs to a thread in the same room', async () => {
		const listRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm3', rid: RID, tmid: 'other-tmid', ts: 100 });
		const { result, navToRoom, navToThread } = renderJumpToMessage(listRef, { tmid: 'tmid-1' });

		await act(async () => {
			await result.current.jumpToMessage('m3');
		});

		expect(navToThread).toHaveBeenCalledWith({ id: 'm3', rid: RID, tmid: 'other-tmid', ts: 100 });
		expect(navToRoom).not.toHaveBeenCalled();
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to the main room when jumping from a thread to a main-room message without replies', async () => {
		const listRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm4', rid: RID, ts: 100, replies: undefined });
		const { result, navToRoom } = renderJumpToMessage(listRef, { tmid: 'tmid-1', t: 'thread' });

		await act(async () => {
			await result.current.jumpToMessage('m4');
		});

		expect(navToRoom).toHaveBeenCalledWith({ id: 'm4', rid: RID, ts: 100, replies: undefined });
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('logs and cancels the jump on an unexpected error', async () => {
		const listRef = createListRef();
		const error = new Error('boom');
		mockGetMessageInfo.mockRejectedValue(error);
		const { result } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('m1');
		});

		expect(mockLog).toHaveBeenCalledWith(error);
		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('shows a room-not-found alert when jumping from a reply hits a not-allowed error', async () => {
		const listRef = createListRef();
		const error = { data: { errorType: 'error-not-allowed' } };
		mockGetMessageInfo.mockRejectedValue(error);
		const { result } = renderJumpToMessage(listRef);

		await act(async () => {
			await result.current.jumpToMessage('m1', true);
		});

		expect(mockShowErrorAlert).toHaveBeenCalledWith('The_room_does_not_exist', 'Room_not_found');
		expect(mockLog).not.toHaveBeenCalled();
		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
	});

	describe('navigation param handling', () => {
		let runAfterInteractionsSpy: jest.SpyInstance;

		beforeEach(() => {
			runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
				task();
				return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as any;
			});
		});

		afterEach(() => {
			runAfterInteractionsSpy.mockRestore();
		});

		it('consumeJumpParam clears the pending jump, triggers the jump and resets the nav param', async () => {
			const listRef = createListRef();
			listRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'm1', rid: RID, ts: 100 });
			const { result } = renderJumpToMessage(listRef);

			await act(async () => {
				result.current.consumeJumpParam('m1');
				await Promise.resolve();
			});

			expect(mockGetMessageInfo).toHaveBeenCalledWith('m1');
			expect(mockSetParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
		});

		it('onThreadMessagesLoaded consumes a pending jump queued from the mount param', async () => {
			mockRouteParams = { jumpToMessageId: 'msg-7' };
			const listRef = createListRef();
			listRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-7', rid: RID, ts: 100 });
			const { result } = renderJumpToMessage(listRef, { tmid: 'tmid-1' });

			await act(async () => {
				result.current.onThreadMessagesLoaded();
				await Promise.resolve();
			});

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-7');
			expect(mockSetParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
		});

		it('onThreadMessagesLoaded is a no-op without a pending jump', () => {
			const listRef = createListRef();
			const { result } = renderJumpToMessage(listRef, { tmid: 'tmid-1' });

			result.current.onThreadMessagesLoaded();

			expect(mockGetMessageInfo).not.toHaveBeenCalled();
			expect(mockSetParams).not.toHaveBeenCalled();
		});

		it('fires the main-list jump on mount when a jumpToMessageId param is present and there is no tmid', () => {
			mockRouteParams = { jumpToMessageId: 'msg-1' };
			const listRef = createListRef();
			listRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-1', rid: RID, ts: 100 });
			renderJumpToMessage(listRef);

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-1');
		});

		it('navigates to the thread on mount when only a jumpToThreadId param is present', () => {
			mockRouteParams = { jumpToThreadId: 'thread-1' };
			const listRef = createListRef();
			const { navToThread } = renderJumpToMessage(listRef);

			expect(navToThread).toHaveBeenCalledWith({ tmid: 'thread-1' });
		});

		it('re-fires the jump when the jumpToMessageId route param changes to a new value', () => {
			mockRouteParams = {};
			const listRef = createListRef();
			listRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-2', rid: RID, ts: 100 });
			const { rerender } = renderJumpToMessage(listRef);

			mockRouteParams = { jumpToMessageId: 'msg-2' };
			rerender({});

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-2');
		});

		it('navigates to the thread when the jumpToThreadId route param changes to a new value', () => {
			mockRouteParams = {};
			const listRef = createListRef();
			const { rerender, navToThread } = renderJumpToMessage(listRef);

			mockRouteParams = { jumpToThreadId: 'thread-2' };
			rerender({});

			expect(navToThread).toHaveBeenCalledWith({ tmid: 'thread-2' });
		});
	});
});

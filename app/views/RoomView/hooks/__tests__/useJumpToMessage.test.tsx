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

const renderJumpToMessage = (listContainerRef: ReturnType<typeof createListRef>, params: TJumpToMessageOverrides = {}) => {
	const navToRoom = jest.fn();
	const navToThread = jest.fn();
	const { result, rerender } = renderHook(
		(props: TJumpToMessageOverrides) => useJumpToMessage({ rid: RID, listContainerRef, navToRoom, navToThread, ...props }),
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
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(true);
		mockGetMessageInfo.mockResolvedValue({ id: 'm1', rid: RID, ts: 100 });
		mockResolveJumpAnchor.mockResolvedValue(12345);
		const { result, navToRoom, navToThread } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			await result.current.jumpToMessage('m1');
		});

		expect(mockResolveJumpAnchor).toHaveBeenCalledWith(RID, { id: 'm1', tmid: undefined, ts: 100, fromServer: undefined }, true, {
			loadSurroundingMessages,
			getLocalAnchorTs
		});
		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledWith('m1', 12345);
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: true, onCancel: result.current.cancelJumpToMessage });
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(navToRoom).not.toHaveBeenCalled();
		expect(navToThread).not.toHaveBeenCalled();
	});

	it('jumps out-of-window: passes inWindow=false and forwards a null anchor to the list', async () => {
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(false);
		mockGetMessageInfo.mockResolvedValue({ id: 'm1', rid: RID, ts: 100 });
		mockResolveJumpAnchor.mockResolvedValue(null);
		const { result } = renderJumpToMessage(listContainerRef);

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
		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledWith('m1', null);
	});

	it('cancelJumpToMessage cancels the list and hides the loading indicator', () => {
		const listContainerRef = createListRef();
		const { result } = renderJumpToMessage(listContainerRef);

		act(() => {
			result.current.cancelJumpToMessage();
		});

		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: false });
	});

	it('cancels the jump when getMessageInfo resolves to no message', async () => {
		const listContainerRef = createListRef();
		mockGetMessageInfo.mockResolvedValue(null);
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			await result.current.jumpToMessage('missing');
		});

		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to another room when the target message lives outside the current room/thread', async () => {
		const listContainerRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm2', rid: 'rid-2', ts: 100 });
		const { result, navToRoom, navToThread } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			await result.current.jumpToMessage('m2');
		});

		expect(navToRoom).toHaveBeenCalledWith({ id: 'm2', rid: 'rid-2', ts: 100 });
		expect(navToThread).not.toHaveBeenCalled();
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to the thread when the target message belongs to a thread in the same room', async () => {
		const listContainerRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm3', rid: RID, tmid: 'other-tmid', ts: 100 });
		const { result, navToRoom, navToThread } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });

		await act(async () => {
			await result.current.jumpToMessage('m3');
		});

		expect(navToThread).toHaveBeenCalledWith({ id: 'm3', rid: RID, tmid: 'other-tmid', ts: 100 });
		expect(navToRoom).not.toHaveBeenCalled();
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to the main room when jumping from a thread to a main-room message without replies', async () => {
		const listContainerRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'm4', rid: RID, ts: 100, replies: undefined });
		const { result, navToRoom } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1', t: 'thread' });

		await act(async () => {
			await result.current.jumpToMessage('m4');
		});

		expect(navToRoom).toHaveBeenCalledWith({ id: 'm4', rid: RID, ts: 100, replies: undefined });
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('navigates to the main room when jumping from a thread to a different thread parent with replies', async () => {
		const listContainerRef = createListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'other-parent', rid: RID, ts: 100, replies: ['u1'] });
		const { result, navToRoom } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1', t: 'thread' });

		await act(async () => {
			await result.current.jumpToMessage('other-parent');
		});

		expect(navToRoom).toHaveBeenCalledWith({ id: 'other-parent', rid: RID, ts: 100, replies: ['u1'] });
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('scrolls in place when jumping to the parent of the thread being viewed', async () => {
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(true);
		mockGetMessageInfo.mockResolvedValue({ id: 'tmid-1', rid: RID, ts: 100, replies: ['u1'] });
		const { result, navToRoom } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1', t: 'thread' });

		await act(async () => {
			await result.current.jumpToMessage('tmid-1');
		});

		expect(navToRoom).not.toHaveBeenCalled();
		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledWith('tmid-1', null);
	});

	it('handles a rejected room navigation as an error instead of leaking it', async () => {
		const listContainerRef = createListRef();
		const error = new Error('room lookup failed');
		mockGetMessageInfo.mockResolvedValue({ id: 'm2', rid: 'rid-2', ts: 100 });
		const { result, navToRoom } = renderJumpToMessage(listContainerRef);
		navToRoom.mockRejectedValue(error);

		await act(async () => {
			await result.current.jumpToMessage('m2');
		});

		expect(mockLog).toHaveBeenCalledWith(error);
		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('handles a rejected thread navigation as an error instead of leaking it', async () => {
		const listContainerRef = createListRef();
		const error = new Error('thread name failed');
		mockGetMessageInfo.mockResolvedValue({ id: 'm3', rid: RID, tmid: 'other-tmid', ts: 100 });
		const { result, navToThread } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });
		navToThread.mockRejectedValue(error);

		await act(async () => {
			await result.current.jumpToMessage('m3');
		});

		expect(mockLog).toHaveBeenCalledWith(error);
		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('drops the jump when cancelled before the message lookup resolves', async () => {
		const listContainerRef = createListRef();
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValue(new Promise(res => (resolveMessage = res)));
		const { result, navToRoom } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1', t: 'thread' });

		await act(async () => {
			const jump = result.current.jumpToMessage('m5');
			result.current.cancelJumpToMessage();
			resolveMessage({ id: 'm5', rid: RID, ts: 100 });
			await jump;
		});

		expect(navToRoom).not.toHaveBeenCalled();
		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('drops the jump when cancelled before the anchor resolves', async () => {
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(true);
		mockGetMessageInfo.mockResolvedValue({ id: 'm6', rid: RID, ts: 100 });
		let resolveAnchor: (value: unknown) => void = () => {};
		mockResolveJumpAnchor.mockReturnValue(new Promise(res => (resolveAnchor = res)));
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			const jump = result.current.jumpToMessage('m6');
			await Promise.resolve();
			result.current.cancelJumpToMessage();
			resolveAnchor(null);
			await jump;
		});

		expect(listContainerRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('drops an earlier jump that resolves after a newer one started', async () => {
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(true);
		let resolveFirst: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValueOnce(new Promise(res => (resolveFirst = res)));
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'mB', rid: RID, ts: 200 });
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			const first = result.current.jumpToMessage('mA');
			await result.current.jumpToMessage('mB');
			resolveFirst({ id: 'mA', rid: RID, ts: 100 });
			await first;
		});

		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledTimes(1);
		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledWith('mB', null);
	});

	it('keeps the newer jump alive when an earlier one fails after it started', async () => {
		const listContainerRef = createListRef();
		listContainerRef.current.isMessageInWindow.mockReturnValue(true);
		let rejectFirst: (error: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValueOnce(new Promise((_, rej) => (rejectFirst = rej)));
		let resolveSecond: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValueOnce(new Promise(res => (resolveSecond = res)));
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			const first = result.current.jumpToMessage('mA');
			const second = result.current.jumpToMessage('mB');
			rejectFirst(new Error('boom'));
			await first;
			resolveSecond({ id: 'mB', rid: RID, ts: 200 });
			await second;
		});

		expect(mockLog).not.toHaveBeenCalled();
		expect(listContainerRef.current.cancelJumpToMessage).not.toHaveBeenCalled();
		expect(listContainerRef.current.jumpToMessage).toHaveBeenCalledWith('mB', null);
	});

	it('logs and cancels the jump on an unexpected error', async () => {
		const listContainerRef = createListRef();
		const error = new Error('boom');
		mockGetMessageInfo.mockRejectedValue(error);
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			await result.current.jumpToMessage('m1');
		});

		expect(mockLog).toHaveBeenCalledWith(error);
		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('shows a room-not-found alert when jumping from a reply hits a not-allowed error', async () => {
		const listContainerRef = createListRef();
		const error = { data: { errorType: 'error-not-allowed' } };
		mockGetMessageInfo.mockRejectedValue(error);
		const { result } = renderJumpToMessage(listContainerRef);

		await act(async () => {
			await result.current.jumpToMessage('m1', true);
		});

		expect(mockShowErrorAlert).toHaveBeenCalledWith('The_room_does_not_exist', 'Room_not_found');
		expect(mockLog).not.toHaveBeenCalled();
		expect(listContainerRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(1);
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

		it('onThreadMessagesLoaded consumes a pending jump queued from the mount param', async () => {
			mockRouteParams = { jumpToMessageId: 'msg-7' };
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-7', rid: RID, ts: 100 });
			const { result } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });

			await act(async () => {
				result.current.onThreadMessagesLoaded();
				await Promise.resolve();
			});

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-7');
			expect(mockSetParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
		});

		it('onThreadMessagesLoaded is a no-op without a pending jump', () => {
			const listContainerRef = createListRef();
			const { result } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });

			result.current.onThreadMessagesLoaded();

			expect(mockGetMessageInfo).not.toHaveBeenCalled();
			expect(mockSetParams).not.toHaveBeenCalled();
		});

		it('fires the main-list jump on mount when a jumpToMessageId param is present and there is no tmid', () => {
			mockRouteParams = { jumpToMessageId: 'msg-1' };
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-1', rid: RID, ts: 100 });
			renderJumpToMessage(listContainerRef);

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-1');
		});

		it('navigates to the thread on mount when only a jumpToThreadId param is present', () => {
			mockRouteParams = { jumpToThreadId: 'thread-1' };
			const listContainerRef = createListRef();
			const { navToThread } = renderJumpToMessage(listContainerRef);

			expect(navToThread).toHaveBeenCalledWith({ tmid: 'thread-1' });
		});

		it('re-fires the jump when the jumpToMessageId route param changes to a new value', () => {
			mockRouteParams = {};
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-2', rid: RID, ts: 100 });
			const { rerender } = renderJumpToMessage(listContainerRef);

			mockRouteParams = { jumpToMessageId: 'msg-2' };
			rerender({});

			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-2');
		});

		it('defers a jumpToMessageId param change in a thread until onThreadMessagesLoaded', async () => {
			mockRouteParams = {};
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-3', rid: RID, tmid: 'tmid-1', ts: 100 });
			const { result, rerender } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });

			mockRouteParams = { jumpToMessageId: 'msg-3' };
			rerender({ tmid: 'tmid-1' });

			expect(mockGetMessageInfo).not.toHaveBeenCalled();

			await act(async () => {
				result.current.onThreadMessagesLoaded();
				await Promise.resolve();
			});

			expect(mockGetMessageInfo).toHaveBeenCalledTimes(1);
			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-3');
			expect(mockSetParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
		});

		it('fires a jumpToMessageId param change immediately once the thread messages are loaded', async () => {
			mockRouteParams = {};
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-4', rid: RID, tmid: 'tmid-1', ts: 100 });
			const { result, rerender } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });
			act(() => {
				result.current.onThreadMessagesLoaded();
			});

			mockRouteParams = { jumpToMessageId: 'msg-4' };
			await act(async () => {
				rerender({ tmid: 'tmid-1' });
			});

			expect(mockGetMessageInfo).toHaveBeenCalledTimes(1);
			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-4');
			expect(mockSetParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
		});

		it('keeps deferring a jumpToMessageId param change after switching to a thread that has not loaded', async () => {
			mockRouteParams = {};
			const listContainerRef = createListRef();
			listContainerRef.current.isMessageInWindow.mockReturnValue(true);
			mockGetMessageInfo.mockResolvedValue({ id: 'msg-5', rid: RID, tmid: 'tmid-2', ts: 100 });
			const { result, rerender } = renderJumpToMessage(listContainerRef, { tmid: 'tmid-1' });
			act(() => {
				result.current.onThreadMessagesLoaded();
			});

			rerender({ tmid: 'tmid-2' });
			mockRouteParams = { jumpToMessageId: 'msg-5' };
			rerender({ tmid: 'tmid-2' });

			expect(mockGetMessageInfo).not.toHaveBeenCalled();

			await act(async () => {
				result.current.onThreadMessagesLoaded();
			});

			expect(mockGetMessageInfo).toHaveBeenCalledTimes(1);
			expect(mockGetMessageInfo).toHaveBeenCalledWith('msg-5');
		});

		it('navigates to the thread when the jumpToThreadId route param changes to a new value', () => {
			mockRouteParams = {};
			const listContainerRef = createListRef();
			const { rerender, navToThread } = renderJumpToMessage(listContainerRef);

			mockRouteParams = { jumpToThreadId: 'thread-2' };
			rerender({});

			expect(navToThread).toHaveBeenCalledWith({ tmid: 'thread-2' });
		});
	});
});

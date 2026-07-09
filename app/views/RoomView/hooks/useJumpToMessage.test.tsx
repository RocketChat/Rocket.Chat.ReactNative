import { act, renderHook } from '@testing-library/react-native';

import { sendLoadingEvent } from '../../../containers/Loading';
import log from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import RoomServices from '../services';
import { resolveJumpAnchor } from '../services/resolveJumpAnchor';
import { useJumpToMessage } from './useJumpToMessage';

jest.mock('../services', () => ({
	__esModule: true,
	default: { getMessageInfo: jest.fn(), getLocalAnchorTs: jest.fn() }
}));
jest.mock('../services/resolveJumpAnchor', () => ({
	resolveJumpAnchor: jest.fn()
}));
jest.mock('../../../containers/Loading', () => ({
	sendLoadingEvent: jest.fn()
}));
jest.mock('../../../lib/methods/loadSurroundingMessages', () => ({
	loadSurroundingMessages: jest.fn()
}));
jest.mock('../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));
jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: { t: jest.fn((key: string) => key) }
}));

const mockGetMessageInfo = RoomServices.getMessageInfo as jest.Mock;
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

const renderJumpToMessage = (
	listRef: ReturnType<typeof createListRef>,
	params: Partial<Parameters<typeof useJumpToMessage>[0]> = {}
) => {
	const navToRoom = jest.fn();
	const navToThread = jest.fn();
	const { result } = renderHook(() => useJumpToMessage({ rid: RID, listRef, navToRoom, navToThread, ...params }));
	return { result, navToRoom, navToThread };
};

describe('useJumpToMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockResolveJumpAnchor.mockResolvedValue(null);
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
			getLocalAnchorTs: RoomServices.getLocalAnchorTs
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
				getLocalAnchorTs: RoomServices.getLocalAnchorTs
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
});

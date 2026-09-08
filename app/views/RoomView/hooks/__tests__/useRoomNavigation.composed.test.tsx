import { InteractionManager } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { sendLoadingEvent } from '../../../../containers/Loading';
import getRoomInfo from '../../../../lib/methods/getRoomInfo';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import getMessageInfo from '../../services/getMessageInfo';
import { fetchThreadName } from '../../services/fetchThreadName';
import { resolveJumpAnchor } from '../../services/resolveJumpAnchor';
import { useRoomNavigation } from '../useRoomNavigation';
import type { IUseRoomNavigationParams } from '../../definitions';

const mockNavigation = { push: jest.fn(), setParams: jest.fn() };
let mockRouteParams: { jumpToMessageId?: string; jumpToThreadId?: string } = {};

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation,
	useRoute: () => ({ params: mockRouteParams })
}));
jest.mock('../../../../lib/methods/helpers', () => {
	const actual = jest.requireActual('../../../../lib/methods/helpers');
	return { ...actual, useDebounce: actual.useDebounce };
});
jest.mock('../../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));
jest.mock('../../../../lib/methods/getRoomInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('../../services/getMessageInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/fetchThreadName', () => ({ fetchThreadName: jest.fn() }));
jest.mock('../../services/resolveJumpAnchor', () => ({ resolveJumpAnchor: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/room', () => ({ makeThreadName: jest.fn(() => 'Parent thread') }));
jest.mock('../../../../i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const mockGetMessageInfo = getMessageInfo as jest.Mock;
const mockGetRoomInfo = getRoomInfo as jest.Mock;
const mockGoRoom = goRoom as jest.Mock;
const mockFetchThreadName = fetchThreadName as jest.Mock;
const mockResolveJumpAnchor = resolveJumpAnchor as jest.Mock;
const mockSendLoadingEvent = sendLoadingEvent as jest.Mock;

const makeListRef = () => ({
	current: {
		isMessageInWindow: jest.fn(),
		jumpToMessage: jest.fn(() => Promise.resolve()),
		cancelJumpToMessage: jest.fn()
	}
});

const renderNavigation = (overrides: Partial<IUseRoomNavigationParams> = {}) =>
	renderHook(
		(props: Partial<IUseRoomNavigationParams>) =>
			useRoomNavigation({
				rid: 'rid-1',
				t: 'c',
				isMasterDetail: false,
				listContainerRef: makeListRef(),
				roomUserIdRef: { current: 'user-1' },
				...props
			}),
		{ initialProps: overrides }
	);

const flush = async () => {
	await act(async () => {
		for (let i = 0; i < 5; i++) {
			await Promise.resolve();
		}
	});
};

describe('useRoomNavigation composed entry points', () => {
	let runAfterInteractionsSpy: jest.SpyInstance;

	beforeEach(() => {
		runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
			task();
			return { cancel: jest.fn() } as any;
		});
		jest.clearAllMocks();
		mockGetMessageInfo.mockReset();
		mockRouteParams = {};
		mockResolveJumpAnchor.mockResolvedValue(null);
		mockFetchThreadName.mockResolvedValue('Thread title');
		mockGetRoomInfo.mockResolvedValue({ rid: 'rid-2' });
	});

	afterEach(() => {
		jest.useRealTimers();
		runAfterInteractionsSpy.mockRestore();
	});

	it('locates and highlights an in-window Message from a Message URL', async () => {
		const listRef = makeListRef();
		listRef.current.isMessageInWindow.mockReturnValue(true);
		mockGetMessageInfo.mockResolvedValue({ id: 'message-1', rid: 'rid-1', ts: 100 });
		mockResolveJumpAnchor.mockResolvedValue(123);
		const { result } = renderNavigation({ listContainerRef: listRef });

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-1');
		});

		expect(mockResolveJumpAnchor).toHaveBeenCalledWith(
			'rid-1',
			{ id: 'message-1', tmid: undefined, ts: 100, fromServer: undefined },
			true,
			expect.objectContaining({ loadSurroundingMessages: expect.any(Function) })
		);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('message-1', 123);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('resolves an out-of-window anchor before requesting the List jump', async () => {
		const listRef = makeListRef();
		listRef.current.isMessageInWindow.mockReturnValue(false);
		mockGetMessageInfo.mockResolvedValue({ id: 'message-2', rid: 'rid-1', ts: 200, fromServer: true });
		mockResolveJumpAnchor.mockResolvedValue(456);
		const { result } = renderNavigation({ listContainerRef: listRef });

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-2');
		});

		expect(mockResolveJumpAnchor).toHaveBeenCalledWith(
			'rid-1',
			expect.objectContaining({ id: 'message-2', fromServer: true }),
			false,
			expect.any(Object)
		);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('message-2', 456);
	});

	it('opens another Room from a Message URL and hands its target to the destination', async () => {
		mockGetMessageInfo.mockResolvedValue({ id: 'message-3', rid: 'rid-2' });
		const { result } = renderNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-3');
		});

		expect(mockGetRoomInfo).toHaveBeenCalledWith('rid-2');
		expect(mockGoRoom).toHaveBeenCalledWith({ item: { rid: 'rid-2' }, isMasterDetail: false, jumpToMessageId: 'message-3' });
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: true, onCancel: expect.any(Function) });
	});

	it('opens a Thread from a Message URL with its resolved title and target', async () => {
		mockGetMessageInfo.mockResolvedValue({ id: 'reply-1', rid: 'rid-1', tmid: 'thread-1' });
		const { result } = renderNavigation();

		await act(async () => {
			await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=reply-1');
		});

		expect(mockFetchThreadName).toHaveBeenCalledWith('rid-1', 'thread-1', 'reply-1', '');
		expect(mockNavigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'thread-1',
			name: 'Thread title',
			t: 'thread',
			roomUserId: 'user-1',
			jumpToMessageId: 'reply-1'
		});
	});

	it('opens a Thread from a Thread press with its reply target', async () => {
		jest.useFakeTimers();
		const { result } = renderNavigation();

		await act(async () => {
			result.current.onThreadPress({ id: 'reply-2', tmid: 'thread-2', tmsg: 'known title' } as any);
			await Promise.resolve();
		});

		expect(mockNavigation.push).toHaveBeenCalledWith(
			'RoomView',
			expect.objectContaining({ tmid: 'thread-2', name: 'Thread title', jumpToMessageId: 'reply-2' })
		);
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it('consumes an initial main-Room route target and allows same-ID reselection after clearing', async () => {
		mockRouteParams = { jumpToMessageId: 'message-4' };
		mockGetMessageInfo.mockResolvedValue({ id: 'message-4', rid: 'rid-1' });
		const { rerender } = renderNavigation();
		await flush();

		expect(mockGetMessageInfo).toHaveBeenCalledWith('message-4');
		expect(mockNavigation.setParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });

		mockRouteParams = {};
		rerender({});
		mockRouteParams = { jumpToMessageId: 'message-4' };
		rerender({});
		await flush();
		expect(mockGetMessageInfo).toHaveBeenCalledTimes(2);
	});

	it('waits for the current Thread to load before consuming its route target', async () => {
		mockRouteParams = { jumpToMessageId: 'message-5' };
		mockGetMessageInfo.mockResolvedValue({ id: 'message-5', rid: 'rid-1', tmid: 'thread-5' });
		const { result } = renderNavigation({ tmid: 'thread-5' });
		await flush();
		expect(mockGetMessageInfo).not.toHaveBeenCalled();

		await act(async () => {
			result.current.onThreadMessagesLoaded();
			await Promise.resolve();
		});
		expect(mockGetMessageInfo).toHaveBeenCalledWith('message-5');
	});

	it('does not let readiness from an old Thread release a target for a switched Thread', async () => {
		mockRouteParams = {};
		const { result, rerender } = renderNavigation({ tmid: 'thread-old' });
		act(() => result.current.onThreadMessagesLoaded());
		await flush();
		rerender({ tmid: 'thread-new' });
		mockRouteParams = { jumpToMessageId: 'message-6' };
		rerender({ tmid: 'thread-new' });
		expect(mockGetMessageInfo).not.toHaveBeenCalled();
		act(() => result.current.onThreadMessagesLoaded());
		expect(mockGetMessageInfo).toHaveBeenCalledWith('message-6');
	});

	it('preserves simultaneous initial Message and Thread target effect ordering', async () => {
		mockRouteParams = { jumpToMessageId: 'message-7', jumpToThreadId: 'thread-7' };
		mockGetMessageInfo.mockResolvedValue({ id: 'message-7', rid: 'rid-1' });
		renderNavigation();
		await flush();

		expect(mockGetMessageInfo).toHaveBeenCalledWith('message-7');
		expect(mockNavigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ tmid: 'thread-7' }));
	});

	it('cancels a Message URL while lookup is pending without navigating after a late success', async () => {
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValue(new Promise(resolve => (resolveMessage = resolve)));
		const listRef = makeListRef();
		const { result } = renderNavigation({ listContainerRef: listRef });

		const pending = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-8');
		const onCancel = mockSendLoadingEvent.mock.calls[0][0].onCancel;
		onCancel();
		resolveMessage({ id: 'message-8', rid: 'rid-2' });
		await act(async () => await pending);

		expect(mockGetRoomInfo).not.toHaveBeenCalled();
		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalled();
	});

	it('keeps a newer URL jump alive when an older lookup succeeds late', async () => {
		let resolveFirst: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)));
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'message-new', rid: 'rid-1' });
		const listRef = makeListRef();
		const { result } = renderNavigation({ listContainerRef: listRef });

		const first = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-old');
		const second = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-new');
		await act(async () => await second);
		resolveFirst({ id: 'message-old', rid: 'rid-1' });
		await act(async () => await first);

		expect(listRef.current.jumpToMessage).toHaveBeenCalledTimes(1);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('message-new', null);
	});

	it('cancels while anchor resolution is pending and suppresses List execution', async () => {
		let resolveAnchor: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockResolvedValue({ id: 'message-9', rid: 'rid-1' });
		mockResolveJumpAnchor.mockReturnValue(new Promise(resolve => (resolveAnchor = resolve)));
		const listRef = makeListRef();
		listRef.current.isMessageInWindow.mockReturnValue(true);
		const { result } = renderNavigation({ listContainerRef: listRef });
		const pending = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-9');
		await flush();
		const onCancel = mockSendLoadingEvent.mock.calls[0][0].onCancel;
		onCancel();
		resolveAnchor(null);
		await act(async () => await pending);
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
	});

	it('settles local loading after List completion and preserves the Fabric delay', async () => {
		jest.useFakeTimers();
		mockGetMessageInfo.mockResolvedValue({ id: 'message-10', rid: 'rid-1' });
		const listRef = makeListRef();
		const { result } = renderNavigation({ listContainerRef: listRef });
		const pending = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-10');
		await act(async () => await Promise.resolve());
		expect(listRef.current.jumpToMessage).not.toHaveBeenCalled();
		jest.advanceTimersByTime(100);
		await act(async () => await pending);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('message-10', null);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		jest.useRealTimers();
	});

	it('reports missing Messages and rejected navigation through the existing loading and error paths', async () => {
		mockGetMessageInfo.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('lookup failed'));
		const listRef = makeListRef();
		const { result } = renderNavigation({ listContainerRef: listRef });

		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=missing'));
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=failed'));
		expect(listRef.current.cancelJumpToMessage).toHaveBeenCalledTimes(2);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('cancels a Thread press during name lookup without opening a destination', async () => {
		let resolveName: (value: string) => void = () => {};
		mockFetchThreadName.mockReturnValue(new Promise(resolve => (resolveName = resolve)));
		const { result } = renderNavigation();

		const pending = act(async () => {
			result.current.onThreadPress({ id: 'reply-3', tmid: 'thread-3' } as any);
			await Promise.resolve();
		});
		await flush();
		const onCancel = mockSendLoadingEvent.mock.calls[0][0].onCancel;
		onCancel();
		resolveName('late title');
		await pending;
		expect(mockNavigation.push).not.toHaveBeenCalled();
	});

	it('retains encrypted titles when opening an undecryptable Thread target', async () => {
		mockGetMessageInfo.mockResolvedValue({ id: 'reply-4', rid: 'rid-1', tmid: 'thread-4', t: 'e2e', e2e: 'pending' });
		const { result } = renderNavigation();
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=reply-4'));
		expect(mockNavigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ name: 'Encrypted_message' }));
	});

	it('cancels scheduled interaction work on unmount while leaving pending lookup settlement unchanged', async () => {
		const cancel = jest.fn();
		const run = jest.spyOn(InteractionManager, 'runAfterInteractions').mockReturnValue({ cancel } as any);
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValue(new Promise(resolve => (resolveMessage = resolve)));
		const { result, unmount } = renderNavigation();
		const pending = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=message-11');
		unmount();
		expect(cancel).toHaveBeenCalled();
		resolveMessage({ id: 'message-11', rid: 'rid-1' });
		await act(async () => await pending);
		run.mockRestore();
	});

	it('keeps overlapping cross-Room lookups observable when the older Room resolves late', async () => {
		let resolveOldRoom: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'old', rid: 'rid-old' }).mockResolvedValueOnce({ id: 'new', rid: 'rid-new' });
		mockGetRoomInfo
			.mockReturnValueOnce(new Promise(resolve => (resolveOldRoom = resolve)))
			.mockResolvedValueOnce({ rid: 'rid-new' });
		const { result } = renderNavigation();

		const oldJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=old');
		await flush();
		const newJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=new');
		await flush();
		await act(async () => await newJump);
		resolveOldRoom({ rid: 'rid-old' });
		await act(async () => await oldJump);

		expect(mockGoRoom).toHaveBeenCalledTimes(2);
	});

	it('keeps overlapping Thread-name lookups observable when the older title resolves late', async () => {
		let resolveOldName: (value: string) => void = () => {};
		mockGetMessageInfo
			.mockResolvedValueOnce({ id: 'old-reply', rid: 'rid-1', tmid: 'old-thread' })
			.mockResolvedValueOnce({ id: 'new-reply', rid: 'rid-1', tmid: 'new-thread' });
		mockFetchThreadName
			.mockReturnValueOnce(new Promise(resolve => (resolveOldName = resolve)))
			.mockResolvedValueOnce('new title');
		const { result } = renderNavigation();

		const oldJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=old-reply');
		await flush();
		const newJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=new-reply');
		await flush();
		await act(async () => await newJump);
		resolveOldName('old title');
		await act(async () => await oldJump);

		expect(mockNavigation.push).toHaveBeenCalledTimes(2);
	});

	it('allows an older jump failure after a newer jump has started at the existing boundary', async () => {
		let rejectOld: (error: unknown) => void = () => {};
		mockGetMessageInfo
			.mockReturnValueOnce(new Promise((_, reject) => (rejectOld = reject)))
			.mockResolvedValueOnce({ id: 'new', rid: 'rid-1' });
		const listRef = makeListRef();
		const { result } = renderNavigation({ listContainerRef: listRef });

		const oldJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=old');
		const newJump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=new');
		rejectOld(new Error('old failed'));
		await act(async () => await oldJump);
		await act(async () => await newJump);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('new', null);
	});

	it('does not deduplicate Thread presses through an identity stub: the real debounce admits only the leading press', async () => {
		jest.useFakeTimers();
		mockFetchThreadName.mockResolvedValue('title');
		const { result } = renderNavigation();

		result.current.onThreadPress({ tmid: 'thread-debounce' } as any);
		result.current.onThreadPress({ tmid: 'thread-debounce' } as any);
		await act(async () => await Promise.resolve());
		expect(mockNavigation.push).toHaveBeenCalledTimes(1);
		jest.runOnlyPendingTimers();
	});

	it('lets a Thread press during a pending Message lookup complete independently', async () => {
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValueOnce(new Promise(resolve => (resolveMessage = resolve)));
		mockFetchThreadName.mockResolvedValue('thread title');
		const { result } = renderNavigation();

		const jump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=pending');
		await act(async () => {
			result.current.onThreadPress({ tmid: 'pressed-thread' } as any);
			await Promise.resolve();
		});
		expect(mockNavigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ tmid: 'pressed-thread' }));
		resolveMessage({ id: 'pending', rid: 'rid-1' });
		await act(async () => await jump);
	});

	it('keeps an older ordinary dismissal timer able to hide newer loading', async () => {
		jest.useFakeTimers();
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValue(new Promise(resolve => (resolveMessage = resolve)));
		mockFetchThreadName.mockResolvedValue('ordinary title');
		const { result } = renderNavigation();

		await act(async () => {
			result.current.onThreadPress({ tmid: 'ordinary-thread' } as any);
			await Promise.resolve();
		});
		await flush();
		const loadingBeforeJump = mockSendLoadingEvent.mock.calls.length;
		const jump = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=newer');
		await act(async () => await Promise.resolve());
		expect(mockSendLoadingEvent.mock.calls.length).toBeGreaterThan(loadingBeforeJump);
		jest.advanceTimersByTime(199);
		const beforeDismissal = mockSendLoadingEvent.mock.calls.length;
		jest.runOnlyPendingTimers();
		expect(mockSendLoadingEvent.mock.calls.length).toBeGreaterThan(beforeDismissal);
		resolveMessage({ id: 'newer', rid: 'rid-1' });
		await flush();
		jest.advanceTimersByTime(100);
		await act(async () => await jump);
		jest.runOnlyPendingTimers();
	});

	it('settles loading when List completion rejects after navigation has begun', async () => {
		const listRef = makeListRef();
		const listError = new Error('list failed');
		listRef.current.jumpToMessage.mockRejectedValue(listError);
		mockGetMessageInfo.mockResolvedValue({ id: 'list-fail', rid: 'rid-1' });
		const { result } = renderNavigation({ listContainerRef: listRef });

		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=list-fail'));
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('hands a cross-Room target to a destination navigation instance and settles there', async () => {
		jest.useFakeTimers();
		mockGetMessageInfo.mockResolvedValue({ id: 'handoff', rid: 'rid-destination' });
		mockGetRoomInfo.mockResolvedValue({ rid: 'rid-destination' });
		const source = renderNavigation({ rid: 'rid-source' });
		await act(async () => await source.result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=handoff'));
		const target = mockGoRoom.mock.calls[0][0].jumpToMessageId;

		mockRouteParams = { jumpToMessageId: target };
		mockGetMessageInfo.mockResolvedValue({ id: target, rid: 'rid-destination' });
		const destinationList = makeListRef();
		destinationList.current.isMessageInWindow.mockReturnValue(true);
		const destination = renderNavigation({ rid: 'rid-destination', listContainerRef: destinationList });
		await flush();
		await act(async () => await jest.advanceTimersByTimeAsync(100));

		expect(mockGetMessageInfo).toHaveBeenCalledWith('handoff');
		expect(destinationList.current.jumpToMessage).toHaveBeenCalledWith('handoff', null);
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		destination.unmount();
		jest.useRealTimers();
	});

	it('uses the existing Thread-to-main destination rules for plain and other-parent Messages', async () => {
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'plain-main', rid: 'rid-1', replies: undefined });
		mockGetMessageInfo.mockResolvedValueOnce({ id: 'other-parent', rid: 'rid-1', replies: ['reply'] });
		const { result } = renderNavigation({ t: 'thread', tmid: 'current-thread' });

		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=plain-main'));
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=other-parent'));
		expect(mockGoRoom).toHaveBeenCalledTimes(2);
	});

	it('jumps in place when the target is the current Thread Parent', async () => {
		const listRef = makeListRef();
		mockGetMessageInfo.mockResolvedValue({ id: 'current-thread', rid: 'rid-1', replies: ['reply'] });
		const { result } = renderNavigation({ t: 'thread', tmid: 'current-thread', listContainerRef: listRef });

		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=current-thread'));
		expect(mockNavigation.push).not.toHaveBeenCalled();
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('current-thread', null);
	});

	it('forwards Master-Detail mode while opening another Room', async () => {
		mockGetMessageInfo.mockResolvedValue({ id: 'master-detail', rid: 'rid-2' });
		const { result } = renderNavigation({ isMasterDetail: true });
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=master-detail'));
		expect(mockGoRoom).toHaveBeenCalledWith(expect.objectContaining({ isMasterDetail: true }));
	});

	it('keeps URL no-ops and missing Thread names observable without opening', async () => {
		const { result } = renderNavigation();
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room'));
		expect(mockGetMessageInfo).not.toHaveBeenCalled();

		mockGetMessageInfo.mockResolvedValue({ id: 'no-name', rid: 'rid-1', tmid: 'thread-no-name' });
		mockFetchThreadName.mockResolvedValue(undefined);
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=no-name'));
		expect(mockNavigation.push).not.toHaveBeenCalled();
	});

	it('settles rejected Room and Thread navigation without leaking errors', async () => {
		mockGetMessageInfo
			.mockResolvedValueOnce({ id: 'room-reject', rid: 'rid-2' })
			.mockResolvedValueOnce({ id: 'thread-reject', rid: 'rid-1', tmid: 'thread' });
		mockGoRoom.mockRejectedValueOnce(new Error('Room failed'));
		mockNavigation.push.mockRejectedValueOnce(new Error('Thread failed'));
		const { result } = renderNavigation();

		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=room-reject'));
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=thread-reject'));
		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
	});

	it('shows the forbidden-reply Room-not-found alert', async () => {
		mockGetMessageInfo.mockRejectedValue({ data: { errorType: 'error-not-allowed' } });
		const { result } = renderNavigation();
		await act(async () => await result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=forbidden', true));
		expect(showErrorAlert).toHaveBeenCalledWith('The_room_does_not_exist', 'Room_not_found');
	});

	it('fires a changed Thread route target after that Thread is already ready', async () => {
		mockRouteParams = {};
		mockGetMessageInfo.mockResolvedValue({ id: 'changed', rid: 'rid-1', tmid: 'ready-thread' });
		const { result, rerender } = renderNavigation({ tmid: 'ready-thread' });
		act(() => result.current.onThreadMessagesLoaded());
		mockRouteParams = { jumpToMessageId: 'changed' };
		rerender({ tmid: 'ready-thread' });
		await flush();
		expect(mockGetMessageInfo).toHaveBeenCalledWith('changed');
	});

	it('does not start a queued initial route target after unmount', () => {
		const run = jest.spyOn(InteractionManager, 'runAfterInteractions').mockReturnValue({ cancel: jest.fn() } as any);
		mockRouteParams = { jumpToMessageId: 'queued' };
		const { unmount } = renderNavigation();
		unmount();
		expect(mockGetMessageInfo).not.toHaveBeenCalled();
		run.mockRestore();
	});

	it('preserves pending asynchronous work after unmount until its own boundary settles', async () => {
		let resolveMessage: (value: unknown) => void = () => {};
		mockGetMessageInfo.mockReturnValue(new Promise(resolve => (resolveMessage = resolve)));
		const listRef = makeListRef();
		const { result, unmount } = renderNavigation({ listContainerRef: listRef });
		const pending = result.current.jumpToMessageByUrl('https://open.rocket.chat/room?msg=unmounted');
		unmount();
		resolveMessage({ id: 'unmounted', rid: 'rid-1' });
		await act(async () => await pending);
		expect(listRef.current.jumpToMessage).toHaveBeenCalledWith('unmounted', null);
	});
});

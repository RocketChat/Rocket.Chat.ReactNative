import { InteractionManager } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { sendLoadingEvent } from '../../../../containers/Loading';
import getRoomInfo from '../../../../lib/methods/getRoomInfo';
import { goRoom } from '../../../../lib/methods/helpers/goRoom';
import log from '../../../../lib/methods/helpers/log';
import { getThreadById } from '../../../../lib/database/services/Thread';
import getThreadName from '../../../../lib/methods/getThreadName';
import { loadSurroundingMessages } from '../../../../lib/methods/loadSurroundingMessages';
import { MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import getLocalAnchorTs from '../../services/getLocalAnchor';
import getMessageInfo from '../../services/getMessageInfo';
import { type IUseJumpToMessageParams } from '../../definitions';
import { useJumpToMessage } from '../useJumpToMessage';

let mockCurrentNavigation: { push: jest.Mock; setParams: jest.Mock };
let mockCurrentParams: { jumpToMessageId?: string; jumpToThreadId?: string };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockCurrentNavigation,
	useRoute: () => ({ params: mockCurrentParams })
}));
jest.mock('../../../../lib/methods/helpers', () => ({
	useDebounce: jest.requireActual('../../../../lib/methods/helpers/debounce').useDebounce
}));
jest.mock('../../../../containers/Loading', () => ({ sendLoadingEvent: jest.fn() }));
jest.mock('../../../../lib/methods/getRoomInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../../../lib/database/services/Thread', () => ({ getThreadById: jest.fn() }));
jest.mock('../../../../lib/methods/getThreadName', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../lib/methods/loadSurroundingMessages', () => ({ loadSurroundingMessages: jest.fn() }));
jest.mock('../../services/getLocalAnchor', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/getMessageInfo', () => ({ __esModule: true, default: jest.fn() }));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const lookup = jest.mocked(getMessageInfo);
const loading = jest.mocked(sendLoadingEvent);
const visibility = () => loading.mock.calls.map(([event]) => event.visible);
const cancelLoading = () => {
	const event = loading.mock.calls.filter(([event]) => event.visible).at(-1)![0];
	act(() => event.onCancel!());
};
const message = (id: string, extra = {}) => ({ id, rid: 'room', ts: 1000, fromServer: false, ...extra });
const flush = () => act(async () => {});
const advance = (ms: number) => act(async () => await jest.advanceTimersByTimeAsync(ms));
let interactions: Array<() => void>;
const releaseInteractions = () => act(() => interactions.splice(0).forEach(run => run()));

function screen(overrides: Partial<IUseJumpToMessageParams> = {}, params: typeof mockCurrentParams = {}) {
	const list = {
		isMessageInWindow: jest.fn(() => true),
		jumpToMessage: jest.fn<Promise<void>, [string, (number | null)?]>().mockResolvedValue(undefined),
		cancelJumpToMessage: jest.fn()
	};
	const navigation = { push: jest.fn(), setParams: jest.fn() };
	const initialProps = { options: overrides, params };
	const hook = renderHook(
		({ options, params }: typeof initialProps) => {
			mockCurrentNavigation = navigation;
			mockCurrentParams = params;
			return useJumpToMessage({
				rid: 'room',
				t: 'c',
				isMasterDetail: false,
				listContainerRef: { current: list },
				roomUserIdRef: { current: 'user' },
				...options
			});
		},
		{ initialProps }
	);
	return {
		...hook,
		list,
		navigation,
		jump: (id: string) => hook.result.current.jumpToMessageByUrl(`https://chat.example/room?msg=${id}`)
	};
}

beforeEach(() => {
	jest.resetAllMocks();
	jest.useFakeTimers();
	interactions = [];
	jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
		let cancelled = false;
		interactions.push(() => {
			if (!cancelled) task();
		});
		return {
			cancel: () => {
				cancelled = true;
			}
		} as any;
	});
	lookup.mockImplementation(async id => message(id) as any);
	jest.mocked(getLocalAnchorTs).mockResolvedValue(2000);
	jest.mocked(loadSurroundingMessages).mockResolvedValue([]);
	jest.mocked(getThreadById).mockResolvedValue(null);
	jest.mocked(getThreadName).mockResolvedValue('Thread title');
	jest.mocked(getRoomInfo).mockResolvedValue({ rid: 'other-room' } as any);
});

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
});

it('suppresses a jump superseded during the Fabric wait without dismissing the newer loading', async () => {
	const view = screen();
	const oldJump = view.jump('old');
	await flush();
	await advance(50);
	const newJump = view.jump('new');
	await flush();
	await advance(50);
	await oldJump;
	expect(view.list.jumpToMessage).not.toHaveBeenCalled();
	expect(visibility()).toEqual([true, true]);
	await advance(50);
	await newJump;
	expect(view.list.jumpToMessage.mock.calls).toEqual([['new', null]]);
	expect(visibility()).toEqual([true, true, false]);
});

it('cancels during the Fabric wait before issuing a List request', async () => {
	const view = screen();
	const jump = view.jump('cancelled');
	await flush();
	cancelLoading();
	await advance(100);
	await jump;
	expect(view.list.jumpToMessage).not.toHaveBeenCalled();
	expect(view.list.cancelJumpToMessage).toHaveBeenCalledTimes(1);
	expect(visibility()).toEqual([true, false]);
});

it.each(['resolve', 'reject'] as const)('ignores an old anchor %s while a newer jump waits', async settle => {
	const anchor = deferred<number | null>();
	jest.mocked(getLocalAnchorTs).mockReturnValueOnce(anchor.promise);
	const view = screen();
	view.list.isMessageInWindow.mockReturnValue(false);
	const oldJump = view.jump('old');
	await flush();
	const newJump = view.jump('new');
	await flush();
	if (settle === 'resolve') anchor.resolve(3000);
	else anchor.reject(new Error('old anchor failed'));
	await oldJump;
	expect(visibility()).toEqual([true, true]);
	expect(log).not.toHaveBeenCalled();
	expect(view.list.cancelJumpToMessage).not.toHaveBeenCalled();
	await advance(100);
	await newJump;
	expect(view.list.jumpToMessage.mock.calls).toEqual([['new', 2000]]);
});

it('resolves the server Chunk anchor through the real resolver before requesting List execution', async () => {
	lookup.mockResolvedValue(message('target', { fromServer: true }) as any);
	jest.mocked(loadSurroundingMessages).mockResolvedValue([
		{ _id: 'target', ts: 1000 },
		{ _id: 'newer-loader', ts: 4000, t: MessageTypeLoad.NEXT_CHUNK }
	] as any);
	const view = screen();
	view.list.isMessageInWindow.mockReturnValue(false);
	const jump = view.jump('target');
	await advance(100);
	await jump;
	expect(view.list.jumpToMessage.mock.calls).toEqual([['target', 4000]]);
	expect(getLocalAnchorTs).not.toHaveBeenCalled();
});

it('lets an older successful List completion dismiss loading while a newer lookup remains pending', async () => {
	const completion = deferred<void>();
	const newerLookup = deferred<any>();
	const view = screen();
	view.list.jumpToMessage.mockReturnValueOnce(completion.promise);
	const oldJump = view.jump('old');
	await advance(100);
	lookup.mockReturnValueOnce(newerLookup.promise);
	const newJump = view.jump('new');
	completion.resolve();
	await oldJump;
	expect(visibility()).toEqual([true, true, false]);
	expect(view.list.jumpToMessage.mock.calls).toEqual([['old', null]]);
	newerLookup.resolve(message('new'));
	await advance(100);
	await newJump;
	expect(view.list.jumpToMessage.mock.calls).toEqual([
		['old', null],
		['new', null]
	]);
});

it('suppresses an older List rejection once a newer jump owns the generation', async () => {
	const completion = deferred<void>();
	const view = screen();
	view.list.jumpToMessage.mockReturnValueOnce(completion.promise);
	const oldJump = view.jump('old');
	await advance(100);
	const newJump = view.jump('new');
	completion.reject(new Error('old List failed'));
	await oldJump;
	expect(visibility()).toEqual([true, true]);
	expect(log).not.toHaveBeenCalled();
	expect(view.list.cancelJumpToMessage).not.toHaveBeenCalled();
	await advance(100);
	await newJump;
});

it('retains List completion settlement even when loading is cancelled after List execution begins', async () => {
	const completion = deferred<void>();
	const view = screen();
	view.list.jumpToMessage.mockReturnValueOnce(completion.promise);
	const jump = view.jump('target');
	await advance(100);
	cancelLoading();
	completion.resolve();
	await jump;
	expect(view.list.cancelJumpToMessage).toHaveBeenCalledTimes(1);
	expect(visibility()).toEqual([true, false, false]);
});

it('still opens a Room if loading is cancelled after Room lookup begins', async () => {
	const room = deferred<any>();
	lookup.mockResolvedValue(message('target', { rid: 'other-room' }) as any);
	jest.mocked(getRoomInfo).mockReturnValueOnce(room.promise);
	const view = screen();
	const jump = view.jump('target');
	await flush();
	cancelLoading();
	room.resolve({ rid: 'other-room', name: 'Other Room' });
	await jump;
	expect(goRoom).toHaveBeenCalledWith({
		item: { rid: 'other-room', name: 'Other Room' },
		isMasterDetail: false,
		jumpToMessageId: 'target'
	});
	expect(visibility()).toEqual([true, false]);
});

it('lets a stale Thread-name failure dismiss loading without logging or cancelling the newer jump', async () => {
	const title = deferred<string>();
	jest.mocked(getThreadName).mockReturnValueOnce(title.promise);
	lookup.mockResolvedValueOnce(message('reply', { tmid: 'thread' }) as any);
	const view = screen();
	const oldJump = view.jump('reply');
	await flush();
	const newJump = view.jump('new');
	await flush();
	title.reject(new Error('old title failed'));
	await oldJump;
	expect(visibility()).toEqual([true, true, true, false]);
	expect(view.navigation.push).not.toHaveBeenCalled();
	expect(log).not.toHaveBeenCalled();
	expect(view.list.cancelJumpToMessage).not.toHaveBeenCalled();
	await advance(100);
	await newJump;
	expect(view.list.jumpToMessage.mock.calls).toEqual([['new', null]]);
});

it('hands loading to a destination Thread, waits for readiness and settles only after its List completes', async () => {
	lookup.mockResolvedValue(message('reply', { tmid: 'thread' }) as any);
	const source = screen();
	await source.jump('reply');
	expect(visibility()).toEqual([true, true]);
	const [routeName, params] = source.navigation.push.mock.calls[0];
	expect(routeName).toBe('RoomView');
	expect(params).toEqual({
		rid: 'room',
		tmid: 'thread',
		t: 'thread',
		name: 'Thread title',
		roomUserId: 'user',
		jumpToMessageId: 'reply'
	});
	const destination = screen({ rid: params.rid, tmid: params.tmid, t: params.t }, { jumpToMessageId: params.jumpToMessageId });
	const completion = deferred<void>();
	destination.list.jumpToMessage.mockReturnValueOnce(completion.promise);
	releaseInteractions();
	await advance(300);
	expect(destination.list.jumpToMessage).not.toHaveBeenCalled();
	expect(visibility()).toEqual([true, true]);
	act(() => destination.result.current.onThreadMessagesLoaded());
	expect(destination.navigation.setParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
	await advance(100);
	expect(destination.list.jumpToMessage.mock.calls).toEqual([['reply', null]]);
	expect(visibility()).toEqual([true, true, true]);
	completion.resolve();
	await flush();
	expect(visibility()).toEqual([true, true, true, false]);
	expect(source.list.jumpToMessage).not.toHaveBeenCalled();
});

it('hands loading to a destination Room after interactions until its List completes', async () => {
	lookup.mockResolvedValue(message('target', { rid: 'other-room' }) as any);
	const source = screen();
	await source.jump('target');
	expect(visibility()).toEqual([true]);
	const target = jest.mocked(goRoom).mock.calls[0][0].jumpToMessageId;
	const destination = screen({ rid: 'other-room' }, { jumpToMessageId: target });
	const completion = deferred<void>();
	destination.list.jumpToMessage.mockReturnValueOnce(completion.promise);
	await advance(300);
	expect(destination.list.jumpToMessage).not.toHaveBeenCalled();
	expect(visibility()).toEqual([true]);
	releaseInteractions();
	await advance(100);
	expect(destination.list.jumpToMessage.mock.calls).toEqual([['target', null]]);
	expect(visibility()).toEqual([true, true]);
	completion.resolve();
	await flush();
	expect(visibility()).toEqual([true, true, false]);
});

it('starts an initial Message target only when scheduled interactions run, then consumes it', async () => {
	const view = screen({}, { jumpToMessageId: 'target' });
	await advance(500);
	expect(lookup).not.toHaveBeenCalled();
	expect(visibility()).toEqual([]);
	releaseInteractions();
	expect(view.navigation.setParams).toHaveBeenCalledWith({ jumpToMessageId: undefined });
	await advance(100);
	expect(view.list.jumpToMessage.mock.calls).toEqual([['target', null]]);
});

it('does not run either scheduled initial target after unmount', async () => {
	const view = screen({}, { jumpToMessageId: 'target', jumpToThreadId: 'thread' });
	view.unmount();
	releaseInteractions();
	await advance(500);
	expect(lookup).not.toHaveBeenCalled();
	expect(view.navigation.push).not.toHaveBeenCalled();
	expect(visibility()).toEqual([]);
});

it('preserves Message then Thread execution when both initial targets are scheduled in a main Room', async () => {
	const view = screen({}, { jumpToMessageId: 'target', jumpToThreadId: 'thread' });
	releaseInteractions();
	await flush();
	expect(visibility()).toEqual([true, true]);
	expect(view.navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ tmid: 'thread', jumpToMessageId: '' }));
	await advance(100);
	expect(view.list.jumpToMessage.mock.calls).toEqual([['target', null]]);
	expect(visibility()).toEqual([true, true, false]);
	await advance(200);
	expect(visibility()).toEqual([true, true, false, false]);
});

it('keeps the initial Thread destination blocked when a Thread Message target still awaits readiness', async () => {
	lookup.mockResolvedValue(message('reply', { tmid: 'current' }) as any);
	const view = screen({ tmid: 'current', t: 'thread' }, { jumpToMessageId: 'reply', jumpToThreadId: 'other' });
	releaseInteractions();
	expect(lookup).not.toHaveBeenCalled();
	expect(view.navigation.push).not.toHaveBeenCalled();
	act(() => view.result.current.onThreadMessagesLoaded());
	await advance(100);
	expect(view.list.jumpToMessage.mock.calls).toEqual([['reply', null]]);
	expect(view.navigation.push).not.toHaveBeenCalled();
});

it('opens updated Thread route targets immediately without waiting for interactions or Thread readiness', async () => {
	const view = screen({ tmid: 'unloaded', t: 'thread' });
	view.rerender({ options: { tmid: 'unloaded', t: 'thread' }, params: { jumpToThreadId: 'other' } });
	await flush();
	expect(view.navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ tmid: 'other', jumpToMessageId: '' }));
	expect(view.navigation.setParams).not.toHaveBeenCalled();
	expect(visibility()).toEqual([true]);
	await advance(300);
	expect(visibility()).toEqual([true, false]);
});

it('retains pending Thread-name navigation and dismissal after unmount', async () => {
	const name = deferred<string>();
	jest.mocked(getThreadName).mockReturnValueOnce(name.promise);
	const view = screen();
	act(() => {
		view.result.current.onThreadPress({ tmid: 'thread' } as any);
	});
	await flush();
	view.unmount();
	name.resolve('Late title');
	await flush();
	expect(view.navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ tmid: 'thread', name: 'Late title' }));
	expect(visibility()).toEqual([true]);
	await advance(300);
	expect(visibility()).toEqual([true, false]);
});

it('opens a Thread Parent directly without showing or dismissing loading', async () => {
	const view = screen();
	act(() => {
		view.result.current.onThreadPress({ id: 'parent', msg: 'Parent title', tlm: undefined } as any);
	});
	await advance(1000);
	expect(view.navigation.push).toHaveBeenCalledWith('RoomView', {
		rid: 'room',
		tmid: 'parent',
		t: 'thread',
		name: 'Parent title',
		roomUserId: 'user'
	});
	expect(visibility()).toEqual([]);
});

it('starts ordinary Thread dismissal before navigation completes, including a target with an empty Message ID', async () => {
	const navigation = deferred<void>();
	const view = screen();
	view.navigation.push.mockReturnValueOnce(navigation.promise);
	act(() => {
		view.result.current.onThreadPress({ id: '', tmid: 'thread' } as any);
	});
	await flush();
	expect(view.navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ jumpToMessageId: '' }));
	await advance(299);
	expect(visibility()).toEqual([true]);
	await advance(1);
	expect(visibility()).toEqual([true, false]);
	navigation.resolve();
	await flush();
	expect(visibility()).toEqual([true, false]);
});

it('does not add loading settlement when cancelled Thread navigation later completes', async () => {
	lookup.mockResolvedValue(message('reply', { tmid: 'thread' }) as any);
	const navigation = deferred<void>();
	const view = screen();
	view.navigation.push.mockReturnValueOnce(navigation.promise);
	const jump = view.jump('reply');
	await flush();
	cancelLoading();
	expect(visibility()).toEqual([true, true, false]);
	navigation.resolve();
	await jump;
	expect(visibility()).toEqual([true, true, false]);
});

it('does not hide newer loading when stale Thread navigation rejects', async () => {
	const navigation = deferred<void>();
	lookup.mockResolvedValueOnce(message('reply', { tmid: 'thread' }) as any);
	const view = screen();
	view.navigation.push.mockReturnValueOnce(navigation.promise);
	const oldJump = view.jump('reply');
	await flush();
	const newJump = view.jump('new');
	await flush();
	navigation.reject(new Error('old navigation failed'));
	await oldJump;
	expect(visibility()).toEqual([true, true, true]);
	expect(log).not.toHaveBeenCalled();
	await advance(100);
	await newJump;
	expect(visibility()).toEqual([true, true, true, false]);
});

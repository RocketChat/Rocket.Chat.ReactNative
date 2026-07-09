import { act, renderHook, waitFor } from '@testing-library/react-native';

import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../lib/methods/readMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import RoomServices from '../services';
import { useRoomSubscription } from './useRoomSubscription';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../services', () => ({
	__esModule: true,
	default: { getMessages: jest.fn(() => Promise.resolve()) }
}));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));

const mockGet = database.active.get as jest.Mock;
const mockGetMessages = RoomServices.getMessages as jest.Mock;
const mockLoadThreadMessages = loadThreadMessages as jest.Mock;
const mockReadMessages = readMessages as jest.Mock;
const mockGetUserInfo = getUserInfo as jest.Mock;
const mockIsGroupChat = isGroupChat as jest.Mock;
const mockIsInviteSubscription = isInviteSubscription as unknown as jest.Mock;

const stubRoom = { rid: 'rid-1', t: 'c' };
const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general' };

const setupObserve = () => {
	let emit: ((rows: any[]) => void) | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: (rows: any[]) => void) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return {
		observeWithColumns,
		query,
		unsubscribe,
		emit: (rows: any[]) => emit?.(rows)
	};
};

describe('useRoomSubscription', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsGroupChat.mockReturnValue(false);
		mockIsInviteSubscription.mockReturnValue(false);
		mockGetMessages.mockResolvedValue(undefined);
		mockLoadThreadMessages.mockResolvedValue(undefined);
		mockReadMessages.mockResolvedValue(undefined);
	});

	it('exposes the initial room synchronously on first render', () => {
		setupObserve();
		const { result } = renderHook(() => useRoomSubscription({ rid: 'rid-1', initialRoom: stubRoom, isAuthenticated: false }));

		expect(result.current.room).toBe(stubRoom);
		expect(result.current.joined).toBe(true);
		expect(result.current.subscribed).toBe(false);
		expect(result.current.member).toEqual({});
		expect(result.current.loading).toBe(true);
	});

	it('marks subscribed and joined when the subscription observable emits a row', () => {
		const { emit } = setupObserve();
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: stubRoom, isAuthenticated: false })
		);

		act(() => {
			emit([subRoom]);
		});

		expect(result.current.room).toBe(subRoom);
		expect(result.current.subscribed).toBe(true);
		expect(result.current.joined).toBe(true);
	});

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserve();
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: stubRoom, isAuthenticated: false })
		);

		act(() => {
			emit([]);
		});

		expect(result.current.subscribed).toBe(false);
		expect(result.current.joined).toBe(false);
		expect(result.current.room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserve();
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'd', initialRoom: stubRoom, isAuthenticated: false })
		);

		act(() => {
			emit([]);
		});

		expect(result.current.subscribed).toBe(false);
		expect(result.current.joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserve();
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: stubRoom, isAuthenticated: false })
		);

		act(() => {
			emit([]);
		});
		expect(result.current.joined).toBe(false);

		act(() => {
			emit([subRoom]);
		});
		expect(result.current.joined).toBe(true);
		expect(result.current.subscribed).toBe(true);
	});

	it('rebuilds a fresh roomUpdate snapshot when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserve();
		const mutable = { ...subRoom, topic: 'old' };
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: stubRoom, isAuthenticated: false })
		);

		act(() => {
			emit([mutable]);
		});
		const first = result.current.roomUpdate;
		expect(first.topic).toBe('old');

		// observeWithColumns re-emits the same cached instance, mutated in place
		mutable.topic = 'new';
		act(() => {
			emit([mutable]);
		});

		expect(result.current.room).toBe(mutable);
		expect(result.current.roomUpdate.topic).toBe('new');
		expect(result.current.roomUpdate).not.toBe(first);
	});

	it('observes with exactly the roomAttrsUpdateColumns values', () => {
		const { observeWithColumns } = setupObserve();
		renderHook(() => useRoomSubscription({ rid: 'rid-1', initialRoom: stubRoom, isAuthenticated: false }));

		expect(observeWithColumns).toHaveBeenCalledWith(Object.values(roomAttrsUpdateColumns));
	});

	it('runs the main init path when authenticated: fetches messages, ends loading, sets member', async () => {
		setupObserve();
		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: subRoom, isAuthenticated: true })
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(result.current.member).toEqual({});
		expect(result.current.canAutoTranslate).toBe(true);
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupObserve();
		const onThreadMessagesLoaded = jest.fn();
		const { result } = renderHook(() =>
			useRoomSubscription({
				rid: 'rid-1',
				tmid: 'tmid-1',
				initialRoom: subRoom,
				isAuthenticated: true,
				onThreadMessagesLoaded
			})
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
	});

	it('retries init after 300ms when it throws', async () => {
		jest.useFakeTimers();
		setupObserve();
		mockGetMessages.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);

		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: subRoom, isAuthenticated: true })
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(mockGetMessages).toHaveBeenCalledTimes(1);

		await act(async () => {
			jest.advanceTimersByTime(300);
			await Promise.resolve();
		});

		expect(mockGetMessages).toHaveBeenCalledTimes(2);
		jest.useRealTimers();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserve();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };

		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'd', initialRoom: dmRoom, isAuthenticated: true })
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(result.current.member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(result.current.roomUserId).toBe('uid-1');
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupObserve();
		mockIsInviteSubscription.mockReturnValue(true);

		const { result } = renderHook(() =>
			useRoomSubscription({ rid: 'rid-1', t: 'c', initialRoom: subRoom, isAuthenticated: true })
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('roomAttrsUpdateColumns has exactly one entry per roomAttrsUpdate key', () => {
		expect(Object.keys(roomAttrsUpdateColumns).sort()).toEqual([...roomAttrsUpdate].sort());
	});
});

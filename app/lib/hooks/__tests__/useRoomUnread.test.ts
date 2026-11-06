import { act, renderHook, waitFor } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import { useRoomUnread } from '../useRoomUnread';

jest.mock('../../database/services/Subscription', () => ({ getSubscriptionByRoomId: jest.fn() }));
jest.mock('../../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const subscriptionMock = getSubscriptionByRoomId as jest.Mock;

describe('useRoomUnread', () => {
	let unread: BehaviorSubject<{ unread?: number }>;

	beforeEach(() => {
		jest.clearAllMocks();
		unread = new BehaviorSubject<{ unread?: number }>({ unread: 3 });
		subscriptionMock.mockResolvedValue({ observe: () => unread });
	});

	it('follows the unread count of the room', async () => {
		const { result } = renderHook(() => useRoomUnread('GENERAL'));
		await waitFor(() => expect(result.current).toBe(3));

		act(() => unread.next({ unread: 5 }));

		expect(result.current).toBe(5);
	});

	it('reads a room with no count as having nothing unread', async () => {
		unread.next({});
		const { result } = renderHook(() => useRoomUnread('GENERAL'));

		await waitFor(() => expect(subscriptionMock).toHaveBeenCalledWith('GENERAL'));

		expect(result.current).toBe(0);
	});

	it('has nothing unread without a room, and does not look one up', () => {
		const { result } = renderHook(() => useRoomUnread(undefined));

		expect(result.current).toBe(0);
		expect(subscriptionMock).not.toHaveBeenCalled();
	});

	it('stops watching the room when it goes away', async () => {
		const { result, unmount } = renderHook(() => useRoomUnread('GENERAL'));
		await waitFor(() => expect(result.current).toBe(3));
		expect(unread.observed).toBe(true);

		unmount();

		expect(unread.observed).toBe(false);
	});

	it('does not start watching a room that was left before it could be looked up', async () => {
		const { unmount } = renderHook(() => useRoomUnread('GENERAL'));

		unmount();
		await act(async () => {
			await Promise.resolve();
		});

		expect(unread.observed).toBe(false);
	});
});

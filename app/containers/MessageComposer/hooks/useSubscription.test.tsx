import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSubscription } from './useSubscription';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';

jest.mock('../../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

describe('useSubscription hook', () => {
	test('should return undefined when rid is not provided', () => {
		const { result } = renderHook(() => useSubscription());
		expect(result.current).toBeUndefined();
		expect(getSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	test('should fetch subscription when rid is provided', async () => {
		const mockSubscription = { _id: 'sub1', rid: 'room1', name: 'test room' };
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(mockSubscription);
		const { result } = renderHook(() => useSubscription('room1'));
		await waitFor(() => {
			expect(result.current).toEqual(mockSubscription);
		});
		expect(getSubscriptionByRoomId).toHaveBeenCalledWith('room1');
	});

	test('should set up polling interval when rid is provided', async () => {
		jest.useFakeTimers();
		const mockSubscription = { _id: 'sub1', rid: 'room2', name: 'test room' };
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(mockSubscription);
		const { unmount } = renderHook(() => useSubscription('room2'));
		const initialCallCount = (getSubscriptionByRoomId as jest.Mock).mock.calls.length;
		act(() => {
			jest.advanceTimersByTime(100);
		});
		await act(async () => {
			await Promise.resolve();
		});
		const finalCallCount = (getSubscriptionByRoomId as jest.Mock).mock.calls.length;
		expect(finalCallCount).toBeGreaterThan(initialCallCount);
		unmount();
		jest.useRealTimers();
	});

	test('should clear interval on unmount', () => {
		jest.useFakeTimers();
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({ _id: 'sub1', rid: 'room3' });
		const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
		const { unmount } = renderHook(() => useSubscription('room3'));
		unmount();
		expect(clearIntervalSpy).toHaveBeenCalled();
		clearIntervalSpy.mockRestore();
		jest.useRealTimers();
	});

	test('should update subscription when rid changes', async () => {
		const mockSubscription1 = { _id: 'sub1', rid: 'room1', name: 'room one' };
		const mockSubscription2 = { _id: 'sub2', rid: 'room2', name: 'room two' };
		(getSubscriptionByRoomId as jest.Mock).mockImplementation(rid => {
			if (rid === 'room1') return Promise.resolve(mockSubscription1);
			if (rid === 'room2') return Promise.resolve(mockSubscription2);
			return Promise.resolve(undefined);
		});
		const { result, rerender } = renderHook(({ roomId }) => useSubscription(roomId), { initialProps: { roomId: 'room1' } });
		await waitFor(() => {
			expect(result.current).toEqual(mockSubscription1);
		});
		rerender({ roomId: 'room2' });
		await waitFor(() => {
			expect(result.current).toEqual(mockSubscription2);
		});
		expect(getSubscriptionByRoomId).toHaveBeenCalledWith('room1');
		expect(getSubscriptionByRoomId).toHaveBeenCalledWith('room2');
	});

	test('should handle null result from service', async () => {
		(getSubscriptionByRoomId as jest.Mock).mockResolvedValue(null);
		const { result } = renderHook(() => useSubscription('non-existent-room'));
		await waitFor(() => {
			expect(getSubscriptionByRoomId).toHaveBeenCalled();
		});
		expect(result.current).toBeUndefined();
	});
});
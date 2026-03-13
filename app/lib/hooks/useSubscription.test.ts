import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useSubscription } from './useSubscription';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

const mockedGetSubscriptionByRoomId = jest.mocked(getSubscriptionByRoomId);

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});

	return { promise, resolve };
};

describe('useSubscription', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return undefined and skip loading when rid is missing', () => {
		const { result } = renderHook(() => useSubscription());

		expect(result.current).toBeUndefined();
		expect(mockedGetSubscriptionByRoomId).not.toHaveBeenCalled();
	});

	it('should load subscription for the provided rid', async () => {
		const subscription = { id: 'sub-1', rid: 'room-1' } as any;
		mockedGetSubscriptionByRoomId.mockResolvedValue(subscription);

		const { result } = renderHook(() => useSubscription('room-1'));

		await waitFor(() => expect(result.current).toBe(subscription));
		expect(mockedGetSubscriptionByRoomId).toHaveBeenCalledWith('room-1');
	});

	it('should keep the current subscription while loading the next rid', async () => {
		const firstSubscription = { id: 'sub-1', rid: 'room-1' } as any;
		const secondSubscription = { id: 'sub-2', rid: 'room-2' } as any;
		const secondRequest = createDeferred<typeof secondSubscription | null>();

		mockedGetSubscriptionByRoomId.mockResolvedValueOnce(firstSubscription).mockImplementationOnce(() => secondRequest.promise);

		const { result, rerender } = renderHook(({ rid }: { rid?: string }) => useSubscription(rid), {
			initialProps: { rid: 'room-1' }
		});

		await waitFor(() => expect(result.current).toBe(firstSubscription));

		rerender({ rid: 'room-2' });

		expect(result.current).toBe(firstSubscription);

		await act(async () => {
			secondRequest.resolve(secondSubscription);
			await secondRequest.promise;
		});

		await waitFor(() => expect(result.current).toBe(secondSubscription));
	});

	it('should return undefined when the lookup does not find a subscription', async () => {
		mockedGetSubscriptionByRoomId.mockResolvedValue(null);

		const { result } = renderHook(() => useSubscription('room-1'));

		await waitFor(() => expect(mockedGetSubscriptionByRoomId).toHaveBeenCalledWith('room-1'));
		expect(result.current).toBeUndefined();
	});

	it('should ignore stale requests when rid changes', async () => {
		const firstSubscription = { id: 'sub-1', rid: 'room-1' } as any;
		const secondSubscription = { id: 'sub-2', rid: 'room-2' } as any;
		const firstRequest = createDeferred<typeof firstSubscription | null>();
		const secondRequest = createDeferred<typeof secondSubscription | null>();

		mockedGetSubscriptionByRoomId
			.mockImplementationOnce(() => firstRequest.promise)
			.mockImplementationOnce(() => secondRequest.promise);

		const { result, rerender } = renderHook(({ rid }: { rid?: string }) => useSubscription(rid), {
			initialProps: { rid: 'room-1' }
		});

		rerender({ rid: 'room-2' });

		await act(async () => {
			firstRequest.resolve(firstSubscription);
			await firstRequest.promise;
		});

		expect(result.current).toBeUndefined();

		await act(async () => {
			secondRequest.resolve(secondSubscription);
			await secondRequest.promise;
		});

		await waitFor(() => expect(result.current).toBe(secondSubscription));
	});
});

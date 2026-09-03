import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getRoutingConfig } from '../../services/restApi';
import { useCanReturnQueue, useRoutingConfigStore } from '../useCanReturnQueue';

jest.mock('../../services/restApi', () => ({ getRoutingConfig: jest.fn() }));

let mockServer = 'https://one.example';
jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: { server: { server: string } }) => unknown) => selector({ server: { server: mockServer } })
}));

const mockGetRoutingConfig = getRoutingConfig as jest.Mock;

describe('useCanReturnQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockServer = 'https://one.example';
		useRoutingConfigStore.getState().reset();
	});

	it('fetches the routing config once for every screen on the same server', async () => {
		mockGetRoutingConfig.mockResolvedValue({ returnQueue: true });

		const first = renderHook(() => useCanReturnQueue(true));
		await waitFor(() => expect(first.result.current).toBe(true));

		const second = renderHook(() => useCanReturnQueue(true));
		await act(async () => {});

		expect(second.result.current).toBe(true);
		expect(mockGetRoutingConfig).toHaveBeenCalledTimes(1);
	});

	it('does not fetch when disabled', async () => {
		const { result } = renderHook(() => useCanReturnQueue(false));
		await act(async () => {});

		expect(result.current).toBe(false);
		expect(mockGetRoutingConfig).not.toHaveBeenCalled();
	});

	it('refetches after the server changes', async () => {
		mockGetRoutingConfig.mockResolvedValueOnce({ returnQueue: true }).mockResolvedValueOnce({ returnQueue: false });

		const { result, rerender } = renderHook(() => useCanReturnQueue(true));
		await waitFor(() => expect(result.current).toBe(true));

		mockServer = 'https://two.example';
		rerender({});
		await waitFor(() => expect(mockGetRoutingConfig).toHaveBeenCalledTimes(2));
		await act(async () => {});

		expect(result.current).toBe(false);
	});

	it('retries on the next screen after a failed fetch', async () => {
		mockGetRoutingConfig.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ returnQueue: true });

		const first = renderHook(() => useCanReturnQueue(true));
		await act(async () => {});
		expect(first.result.current).toBe(false);

		const second = renderHook(() => useCanReturnQueue(true));
		await waitFor(() => expect(second.result.current).toBe(true));

		expect(mockGetRoutingConfig).toHaveBeenCalledTimes(2);
	});

	it('refetches after the cache is reset', async () => {
		mockGetRoutingConfig.mockResolvedValueOnce({ returnQueue: true }).mockResolvedValueOnce({ returnQueue: false });

		const first = renderHook(() => useCanReturnQueue(true));
		await waitFor(() => expect(first.result.current).toBe(true));

		act(() => useRoutingConfigStore.getState().reset());

		const second = renderHook(() => useCanReturnQueue(true));
		await waitFor(() => expect(mockGetRoutingConfig).toHaveBeenCalledTimes(2));

		expect(second.result.current).toBe(false);
	});
});

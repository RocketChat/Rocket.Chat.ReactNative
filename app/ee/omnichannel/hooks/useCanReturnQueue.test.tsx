import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

jest.mock('../../../lib/services/restApi', () => ({ getRoutingConfig: jest.fn() }));

import { getRoutingConfig } from '../../../lib/services/restApi';
import routingConfigSaga from '../sagas/routingConfig';
import { createRecordingStore, cancelSagaTasks } from '../../../lib/testUtils/sagaStore';
import { useCanReturnQueue } from './useCanReturnQueue';
import type { ReactNode } from 'react';

const mockGetRoutingConfig = getRoutingConfig as jest.MockedFunction<typeof getRoutingConfig>;

afterEach(() => {
	cancelSagaTasks();
	jest.clearAllMocks();
});

const createWrapper = () => {
	const recording = createRecordingStore(routingConfigSaga);
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={recording.store}>{children}</Provider>;
	return { ...recording, Wrapper };
};

it('does not request when disabled and stays false while unloaded', () => {
	const { Wrapper } = createWrapper();
	const { result } = renderHook(() => useCanReturnQueue(false), { wrapper: Wrapper });

	expect(result.current).toBe(false);
	expect(mockGetRoutingConfig).not.toHaveBeenCalled();
});

it('requests once when two consumers mount together', async () => {
	mockGetRoutingConfig.mockResolvedValue({ returnQueue: true } as never);
	const { Wrapper } = createWrapper();
	const first = renderHook(() => useCanReturnQueue(true), { wrapper: Wrapper });
	const second = renderHook(() => useCanReturnQueue(true), { wrapper: Wrapper });

	await waitFor(() => expect(first.result.current).toBe(true));
	expect(second.result.current).toBe(true);
	expect(mockGetRoutingConfig).toHaveBeenCalledTimes(1);
});

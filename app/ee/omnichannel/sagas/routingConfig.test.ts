jest.mock('../../../lib/services/restApi', () => ({ getRoutingConfig: jest.fn() }));

import { getRoutingConfig } from '../../../lib/services/restApi';
import { routingConfigRequest } from '../actions/routingConfig';
import routingConfig from './routingConfig';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../../lib/testUtils/sagaStore';

const mockGetRoutingConfig = getRoutingConfig as jest.MockedFunction<typeof getRoutingConfig>;

afterEach(() => {
	cancelSagaTasks();
	jest.clearAllMocks();
});

it('loads once and retries after a failed request', async () => {
	mockGetRoutingConfig.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ returnQueue: true } as never);
	const { store } = createRecordingStore(routingConfig);

	store.dispatch(routingConfigRequest());
	await flushSagaMicrotasks();
	expect(store.getState().routingConfig.returnQueue).toBeNull();

	store.dispatch(routingConfigRequest());
	await flushSagaMicrotasks();
	expect(store.getState().routingConfig.returnQueue).toBe(true);
	expect(mockGetRoutingConfig).toHaveBeenCalledTimes(2);
});

it('ignores repeated requests after loading', async () => {
	mockGetRoutingConfig.mockResolvedValue({ returnQueue: false } as never);
	const { store } = createRecordingStore(routingConfig);

	store.dispatch(routingConfigRequest());
	store.dispatch(routingConfigRequest());
	await flushSagaMicrotasks();

	expect(store.getState().routingConfig.returnQueue).toBe(false);
	expect(mockGetRoutingConfig).toHaveBeenCalledTimes(1);
});

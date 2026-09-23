import { subscribeToApps, useAppsStore } from '../appsStore';
import { UIActionButtonContext } from '../definitions';

const mockGetAppActionButtons = jest.fn(() =>
	Promise.resolve([
		{ appId: 'app-id', actionId: 'summarize', context: UIActionButtonContext.MESSAGE_BOX_ACTION, labelI18n: 'summarize' }
	])
);
const mockGetAppsLanguages = jest.fn(() =>
	Promise.resolve({ apps: [{ id: 'app-id', languages: { en: { summarize: 'Summarize' } } }] })
);
jest.mock('~/lib/services/restApi', () => ({
	getAppActionButtons: () => mockGetAppActionButtons(),
	getAppsLanguages: () => mockGetAppsLanguages()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockStop = jest.fn();
const mockUnsubscribe = jest.fn(() => Promise.resolve());
const mockOnStreamData = jest.fn(() => Promise.resolve({ stop: mockStop }));
const mockSubscribe = jest.fn(() => Promise.resolve({ unsubscribe: mockUnsubscribe }));
jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		onStreamData: (...args: unknown[]) => mockOnStreamData(...(args as [])),
		subscribe: (...args: unknown[]) => mockSubscribe(...(args as []))
	}
}));

const mockState = { login: { isAuthenticated: false }, meteor: { connected: false } };
const mockListeners = new Set<() => void>();
jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: () => mockState,
		subscribe: (listener: () => void) => {
			mockListeners.add(listener);
			return () => mockListeners.delete(listener);
		}
	}
}));

const setLoginReady = (ready: boolean) => {
	mockState.login.isAuthenticated = ready;
	mockState.meteor.connected = ready;
	mockListeners.forEach(listener => listener());
};

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('subscribeToApps', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState.login.isAuthenticated = false;
		mockState.meteor.connected = false;
		mockListeners.clear();
		useAppsStore.getState().reset();
	});

	it('waits for login to be ready before fetching and subscribing', async () => {
		const dispose = subscribeToApps();

		expect(mockGetAppActionButtons).not.toHaveBeenCalled();
		expect(mockSubscribe).not.toHaveBeenCalled();

		setLoginReady(true);
		await flush();

		expect(mockGetAppActionButtons).toHaveBeenCalledTimes(1);
		expect(mockSubscribe).toHaveBeenCalledTimes(1);
		expect(useAppsStore.getState().actionButtons).toHaveLength(1);

		dispose();
	});

	it('subscribes immediately when login is already ready', async () => {
		setLoginReady(true);

		const dispose = subscribeToApps();
		await flush();

		expect(mockSubscribe).toHaveBeenCalledTimes(1);

		dispose();
	});

	it('resubscribes on reconnect while the consumer stays mounted', async () => {
		setLoginReady(true);
		const dispose = subscribeToApps();
		await flush();

		setLoginReady(false);
		await flush();

		expect(mockStop).toHaveBeenCalledTimes(1);
		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

		setLoginReady(true);
		await flush();

		expect(mockSubscribe).toHaveBeenCalledTimes(2);
		expect(mockGetAppActionButtons).toHaveBeenCalledTimes(2);

		dispose();
	});

	it('retries on the next reconnect after a failed subscribe', async () => {
		mockOnStreamData.mockImplementationOnce(() => {
			throw new Error('Sdk is not initialized');
		});

		setLoginReady(true);
		const dispose = subscribeToApps();
		await flush();

		expect(mockSubscribe).not.toHaveBeenCalled();

		setLoginReady(false);
		setLoginReady(true);
		await flush();

		expect(mockSubscribe).toHaveBeenCalledTimes(1);

		dispose();
	});

	it('keeps a single subscription while more than one consumer is mounted', async () => {
		setLoginReady(true);
		const first = subscribeToApps();
		const second = subscribeToApps();
		await flush();

		expect(mockSubscribe).toHaveBeenCalledTimes(1);

		first();
		await flush();
		expect(mockUnsubscribe).not.toHaveBeenCalled();

		second();
		await flush();
		expect(mockStop).toHaveBeenCalledTimes(1);
		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
	});
});

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
const mockOnStreamData = jest.fn((_event: string, _callback: (message: unknown) => void) => Promise.resolve({ stop: mockStop }));
const mockSubscribe = jest.fn(() => Promise.resolve({ unsubscribe: mockUnsubscribe }));
jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		onStreamData: (event: string, callback: (message: unknown) => void) => mockOnStreamData(event, callback),
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

const notify = () => mockListeners.forEach(listener => listener());

const setLoginReady = (ready: boolean) => {
	mockState.login.isAuthenticated = ready;
	mockState.meteor.connected = ready;
	notify();
};

/** Keeps the session authenticated so only the transport flaps, as it does on a socket drop. */
const setConnected = (connected: boolean) => {
	mockState.meteor.connected = connected;
	notify();
};

const streamCallback = () => mockOnStreamData.mock.calls[0][1] as (message: unknown) => void;

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

	it('resubscribes when only the transport flaps, with the session still authenticated', async () => {
		setLoginReady(true);
		const dispose = subscribeToApps();
		await flush();

		setConnected(false);
		await flush();

		expect(mockState.login.isAuthenticated).toBe(true);
		expect(mockStop).toHaveBeenCalledTimes(1);
		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

		setConnected(true);
		await flush();

		expect(mockSubscribe).toHaveBeenCalledTimes(2);

		dispose();
	});

	it('refetches only the action buttons on actions/changed', async () => {
		setLoginReady(true);
		const dispose = subscribeToApps();
		await flush();
		mockGetAppActionButtons.mockClear();
		mockGetAppsLanguages.mockClear();

		streamCallback()({ fields: { args: [['actions/changed', []]] } });
		await flush();

		expect(mockGetAppActionButtons).toHaveBeenCalledTimes(1);
		expect(mockGetAppsLanguages).not.toHaveBeenCalled();

		dispose();
	});

	it('refetches only the translations on app/added', async () => {
		setLoginReady(true);
		const dispose = subscribeToApps();
		await flush();
		mockGetAppActionButtons.mockClear();
		mockGetAppsLanguages.mockClear();

		streamCallback()({ fields: { args: [['app/added', ['app-id']]] } });
		await flush();

		expect(mockGetAppsLanguages).toHaveBeenCalledTimes(1);
		expect(mockGetAppActionButtons).not.toHaveBeenCalled();

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

import { readMessages } from './readMessages';
import log from './helpers/log';
import { hasE2EEWarning } from '../encryption/utils';

const mockFind = jest.fn<Promise<any>, [string]>();
const mockWrite = jest.fn((work: () => Promise<void>) => work());

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ find: (rid: string) => mockFind(rid) }),
			write: (work: () => Promise<void>) => mockWrite(work)
		}
	}
}));

const mockPost = jest.fn<Promise<any>, unknown[]>(() => Promise.resolve({ success: true }));
jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		post: (...args: unknown[]) => mockPost(...args)
	}
}));

const mockEncryptionEnabled = { enabled: true };
jest.mock('../store/auxStore', () => ({
	store: {
		getState: () => ({ encryption: mockEncryptionEnabled })
	}
}));

jest.mock('../encryption/utils', () => ({
	hasE2EEWarning: jest.fn(() => false)
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedHasE2EEWarning = hasE2EEWarning as jest.MockedFunction<typeof hasE2EEWarning>;

describe('readMessages', () => {
	const rid = 'GENERAL';

	const makeSubscription = (fields: Record<string, any> = {}) => {
		const subscription: Record<string, any> = { encrypted: false, E2EKey: null, ...fields };
		subscription.update = jest.fn((updater: (s: any) => void) => Promise.resolve(updater(subscription)));
		return subscription;
	};

	let consoleWarn: jest.SpyInstance;
	let consoleLog: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		mockEncryptionEnabled.enabled = true;
		mockPost.mockImplementation(() => Promise.resolve({ success: true }));
		mockedHasE2EEWarning.mockReturnValue(false);
		consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleWarn.mockRestore();
		consoleLog.mockRestore();
	});

	it('warns and skips the request when the subscription is not found', async () => {
		mockFind.mockRejectedValue(new Error('not found'));

		await expect(readMessages(rid)).resolves.toBeUndefined();

		expect(consoleWarn).toHaveBeenCalledWith(`Subscription not found for rid: ${rid}. Skipping readMessages.`);
		expect(mockPost).not.toHaveBeenCalled();
		expect(mockWrite).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('skips the request when the room has an E2EE warning', async () => {
		const subscription = makeSubscription({ encrypted: true, E2EKey: null });
		mockFind.mockResolvedValue(subscription);
		mockedHasE2EEWarning.mockReturnValue(true);

		await readMessages(rid);

		expect(consoleLog).toHaveBeenCalledWith('Read messages skipped because of E2EE warning');
		expect(mockPost).not.toHaveBeenCalled();
		expect(subscription.update).not.toHaveBeenCalled();
	});

	it('passes the store encryption flag and the room key into the E2EE check', async () => {
		mockEncryptionEnabled.enabled = false;
		mockFind.mockResolvedValue(makeSubscription({ encrypted: true, E2EKey: 'the-key' }));

		await readMessages(rid);

		expect(mockedHasE2EEWarning).toHaveBeenCalledWith({
			encryptionEnabled: false,
			E2EKey: 'the-key',
			roomEncrypted: true
		});
	});

	it('does not run the E2EE check when the subscription has no encrypted field', async () => {
		const subscription = makeSubscription();
		delete subscription.encrypted;
		mockFind.mockResolvedValue(subscription);

		await readMessages(rid);

		expect(mockedHasE2EEWarning).not.toHaveBeenCalled();
		expect(mockPost).toHaveBeenCalled();
	});

	it('reads the subscription on the server, then clears its unread state locally', async () => {
		const subscription = makeSubscription({
			open: false,
			alert: true,
			unread: 7,
			userMentions: 2,
			groupMentions: 1
		});
		mockFind.mockResolvedValue(subscription);

		await readMessages(rid);

		expect(mockPost).toHaveBeenCalledWith('subscriptions.read', { rid });
		expect(subscription.open).toBe(true);
		expect(subscription.alert).toBe(false);
		expect(subscription.unread).toBe(0);
		expect(subscription.userMentions).toBe(0);
		expect(subscription.groupMentions).toBe(0);
		expect(mockPost.mock.invocationCallOrder[0]).toBeLessThan(mockWrite.mock.invocationCallOrder[0]);
	});

	it('swallows a failing subscription update', async () => {
		const subscription = makeSubscription();
		subscription.update = jest.fn(() => Promise.reject(new Error('update failed')));
		mockFind.mockResolvedValue(subscription);

		await expect(readMessages(rid)).resolves.toBeUndefined();

		expect(subscription.update).toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('logs and leaves the unread state alone when the server call fails', async () => {
		const subscription = makeSubscription({ unread: 7 });
		mockFind.mockResolvedValue(subscription);
		mockPost.mockImplementation(() => Promise.reject(new Error('offline')));

		await expect(readMessages(rid)).resolves.toBeUndefined();

		expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'offline' }));
		expect(subscription.update).not.toHaveBeenCalled();
		expect(subscription.unread).toBe(7);
	});
});

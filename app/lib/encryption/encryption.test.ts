// Bypass the global mock of `app/lib/encryption` declared in jest.setup.js by
// importing directly from the file. We exercise the real `encryptMessage` here.
import encryption from './encryption';
import database from '../database';
import Deferred from './helpers/deferred';

jest.unmock('./encryption');

jest.mock('expo-file-system/legacy', () => ({
	deleteAsync: jest.fn()
}));

jest.mock('../services/restApi', () => ({
	e2eSetUserPublicAndPrivateKeys: jest.fn(),
	e2eRequestSubscriptionKeys: jest.fn(),
	fetchUsersWaitingForGroupKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn()
}));

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: { getString: jest.fn(), setString: jest.fn(), removeItem: jest.fn() }
}));

jest.mock('../methods/helpers/protectedFunction', () => ({
	__esModule: true,
	default: (fn: any) => fn
}));

const mockGetState = jest.fn();
jest.mock('../store/auxStore', () => ({
	store: {
		getState: () => mockGetState()
	}
}));

const mockSubFind = jest.fn();
// Rows returned by `collection.query(...).fetch()`, keyed by collection name.
const mockQueryRows: Record<string, unknown[]> = {};
const mockDbBatch = jest.fn((...args: any[]) => {
	// db.batch commits prepared records, clearing their pending state (like the real writer).
	args.flat().forEach((item: any) => {
		if (item && typeof item === 'object' && '_preparedState' in item) {
			item._preparedState = null;
		}
	});
	return Promise.resolve(undefined);
});
jest.mock('../database', () => {
	let writerQueue: Promise<unknown> = Promise.resolve();
	return {
		__esModule: true,
		default: {
			active: {
				get: (name: string) => ({
					find: (rid: string) => mockSubFind(rid),
					query: () => ({ fetch: () => Promise.resolve(mockQueryRows[name] ?? []) })
				}),
				// Serialized writer lock, like WatermelonDB's.
				write: (callback: () => Promise<void>) => {
					const run = writerQueue.then(() => callback());
					writerQueue = run.catch(() => undefined);
					return run;
				},
				batch: (...args: unknown[]) => mockDbBatch(...args)
			}
		}
	};
});

const mockGetSubscriptionByRoomId = jest.fn();
jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: (rid: string) => mockGetSubscriptionByRoomId(rid)
}));

const mockRoomEncrypt = jest.fn();
const mockRoomEncryptFile = jest.fn();
const mockHasSessionKey = jest.fn();
const mockHandshake = jest.fn().mockResolvedValue(undefined);
jest.mock('./room', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		handshake: mockHandshake,
		hasSessionKey: () => mockHasSessionKey(),
		encrypt: (m: any) => mockRoomEncrypt(m),
		encryptFile: (rid: string, file: any) => mockRoomEncryptFile(rid, file)
	}))
}));

const baseMessage = { _id: 'm1', rid: 'r1', msg: 'hello' } as any;

describe('Encryption.encryptMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// fresh handshake mock since clearAllMocks resets the implementation default
		mockHandshake.mockResolvedValue(undefined);
		// Force getRoomInstance to rebuild the EncryptionRoom on every test by
		// clearing any cached instance from the singleton.
		(encryption as any).roomInstances = {};
	});

	it('returns the plain message when workspace E2E is disabled, even if the local subscription is flagged as encrypted', async () => {
		// This is the regression case: web does not encrypt when E2E_Enable is off
		// at the workspace level. Mobile must do the same to avoid sending an
		// undefined message downstream when the local subscription has a stale
		// `encrypted: true` flag and no session key is available.
		mockGetState.mockReturnValue({ settings: { E2E_Enable: false } });
		mockSubFind.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		const result = await encryption.encryptMessage(baseMessage);

		expect(result).toBe(baseMessage);
		expect(mockSubFind).not.toHaveBeenCalled();
		expect(mockRoomEncrypt).not.toHaveBeenCalled();
	});

	it('returns the plain message when the local subscription is not encrypted', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockSubFind.mockResolvedValue({ encrypted: false });

		const result = await encryption.encryptMessage(baseMessage);

		expect(result).toBe(baseMessage);
		expect(mockRoomEncrypt).not.toHaveBeenCalled();
	});

	it('returns undefined when the room is encrypted but no session key is available', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockSubFind.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		const result = await encryption.encryptMessage(baseMessage);

		expect(result).toBeUndefined();
		expect(mockRoomEncrypt).not.toHaveBeenCalled();
	});

	it('encrypts the message when the room is encrypted and a session key is available', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockSubFind.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(true);
		const encrypted = { ...baseMessage, t: 'e2e', msg: 'cipher' };
		mockRoomEncrypt.mockReturnValue(encrypted);

		const result = await encryption.encryptMessage(baseMessage);

		expect(result).toBe(encrypted);
		expect(mockRoomEncrypt).toHaveBeenCalledWith(baseMessage);
	});

	it('falls back to the plain message when the subscription lookup throws', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockSubFind.mockRejectedValue(new Error('not found'));

		const result = await encryption.encryptMessage(baseMessage);

		expect(result).toBe(baseMessage);
		expect(mockRoomEncrypt).not.toHaveBeenCalled();
	});
});

describe('Encryption.encryptFile', () => {
	const file = { rid: 'r1', name: 'photo.jpg', path: '/tmp/photo.jpg', size: 1, type: 'image/jpeg' } as any;

	beforeEach(() => {
		jest.clearAllMocks();
		mockHandshake.mockResolvedValue(undefined);
		(encryption as any).roomInstances = {};
	});

	it('uploads the plain file when the room is not encrypted', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: false });

		await expect(encryption.encryptFile('r1', file)).resolves.toEqual({ file });
	});

	it('uploads the plain file when workspace E2E is disabled, even if the local subscription is flagged as encrypted', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: false } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });

		await expect(encryption.encryptFile('r1', file)).resolves.toEqual({ file });
		expect(mockRoomEncryptFile).not.toHaveBeenCalled();
	});

	it('throws instead of uploading the plain file when the room is encrypted but no session key is available', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		await expect(encryption.encryptFile('r1', file)).rejects.toThrow('Room encryption key is not available');
		expect(mockRoomEncryptFile).not.toHaveBeenCalled();
	});

	it('does not upload the plain file while workspace settings are still loading', async () => {
		mockGetState.mockReturnValue({ settings: {} });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		await expect(encryption.encryptFile('r1', file)).rejects.toThrow('Room encryption key is not available');
	});

	it('encrypts the file when the room is encrypted and a session key is available', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(true);
		const encrypted = { file: { ...file, path: '/tmp/encrypted' } };
		mockRoomEncryptFile.mockResolvedValue(encrypted);

		await expect(encryption.encryptFile('r1', file)).resolves.toBe(encrypted);
		expect(mockRoomEncryptFile).toHaveBeenCalledWith('r1', file);
	});
});

describe('Encryption.canSendToRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockHandshake.mockResolvedValue(undefined);
		(encryption as any).roomInstances = {};
		const readyPromise = new Deferred();
		readyPromise.resolve();
		(encryption as any).readyPromise = readyPromise;
	});

	it('allows rooms that are not encrypted', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true }, encryption: { enabled: false, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: false });

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(true);
	});

	it('blocks rooms without a subscription', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true }, encryption: { enabled: true, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue(null);

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(false);
		expect(mockHandshake).not.toHaveBeenCalled();
	});

	it('allows encrypted rooms when workspace E2E is disabled', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: false }, encryption: { enabled: false, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(true);
	});

	it('blocks encrypted rooms while the E2EE password has not been entered', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true }, encryption: { enabled: false, banner: 'REQUEST_PASSWORD' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(false);
		expect(mockHandshake).not.toHaveBeenCalled();
	});

	it('blocks encrypted rooms without a session key', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true }, encryption: { enabled: true, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(false);
	});

	it('blocks encrypted rooms without a session key while workspace settings are still loading', async () => {
		mockGetState.mockReturnValue({ settings: {}, encryption: { enabled: true, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(false);

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(false);
	});

	it('allows encrypted rooms with a session key', async () => {
		mockGetState.mockReturnValue({ settings: { E2E_Enable: true }, encryption: { enabled: true, banner: '' } });
		mockGetSubscriptionByRoomId.mockResolvedValue({ encrypted: true });
		mockHasSessionKey.mockReturnValue(true);

		await expect(encryption.canSendToRoom('r1')).resolves.toBe(true);
	});
});

// Mimics a WatermelonDB Model: prepareUpdate throws while a previous prepared
// update has not been committed yet.
const makeRecord = (table: string, id: string, fields: Record<string, any> = {}) => {
	const record: any = {
		id,
		...fields,
		_preparedState: null,
		prepareUpdate(recordUpdater: (m: any) => void) {
			if (record._preparedState) {
				throw new Error(`Cannot update a record with pending changes (${table}#${id})`);
			}
			recordUpdater(record);
			record._preparedState = 'update';
			return record;
		}
	};
	return record;
};

describe('Encryption.decryptPendingMessages', () => {
	const rid = 'r1';

	const makeMessageRecord = (id: string) => makeRecord('messages', id, { t: 'e2e', msg: 'cipher', subscription: { id: rid } });

	const deferred = () => {
		let resolve: () => void = () => undefined;
		const promise = new Promise<void>(r => {
			resolve = r;
		});
		return { promise, resolve };
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockQueryRows.messages = [];
		mockQueryRows.threads = [];
		mockQueryRows.thread_messages = [];
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not throw "pending changes" when a concurrent writer touches the same message mid-decrypt', async () => {
		const record = makeMessageRecord('m1');
		mockQueryRows.messages = [record];
		jest.spyOn(encryption, 'decryptMessage').mockResolvedValue({ msg: 'plain', e2e: 'done' } as any);

		const db = (database as any).active;

		// Hold the writer lock — as a new incoming message being saved would — and then update
		// the very record decryptPendingMessages is about to prepare.
		const concurrentGate = deferred();
		const concurrentWrite = db.write(async () => {
			await concurrentGate.promise;
			await db.batch([
				record.prepareUpdate((m: any) => {
					m.msg = 'written by another writer';
				})
			]);
		});

		const decrypting = encryption.decryptPendingMessages(rid);

		// Give an unlocked implementation the chance to prepare now — before the concurrent
		// writer runs — and hold the record pending until its own batch.
		await new Promise(resolve => setImmediate(resolve));
		concurrentGate.resolve();

		await expect(Promise.all([concurrentWrite, decrypting])).resolves.toBeDefined();

		// The decrypted update reached db.batch and nothing was left prepared-but-uncommitted.
		const committed = mockDbBatch.mock.calls.map(call => call.flat()).some(items => items.includes(record));
		expect(committed).toBe(true);
		expect(record.msg).toBe('plain');
		expect(record.e2e).toBe('done');
		expect(record._preparedState).toBeNull();
	});

	it('skips a record whose prepareUpdate throws and still commits the others', async () => {
		const failing = makeMessageRecord('m1');
		// Already prepared by someone else, so prepareUpdate throws for this one.
		failing._preparedState = 'update';
		const healthy = makeMessageRecord('m2');
		mockQueryRows.messages = [failing, healthy];
		jest.spyOn(encryption, 'decryptMessage').mockResolvedValue({ msg: 'plain', e2e: 'done' } as any);

		await encryption.decryptPendingMessages(rid);

		const batched = mockDbBatch.mock.calls.flatMap(call => call.flat());
		expect(batched).toContain(healthy);
		expect(batched).not.toContain(failing);
		expect(healthy.msg).toBe('plain');
		expect(failing.msg).toBe('cipher');
	});
});

describe('Encryption.decryptPendingSubscriptions', () => {
	const makeSubscriptionRecord = (id: string) =>
		makeRecord('subscriptions', id, { lastMessage: { t: 'e2e', e2e: 'pending', msg: 'cipher' } });

	beforeEach(() => {
		jest.clearAllMocks();
		mockQueryRows.subscriptions = [];
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('leaves no subscription prepared-but-uncommitted when one decryption rejects', async () => {
		const healthy = makeSubscriptionRecord('s1');
		const failing = makeSubscriptionRecord('s2');
		mockQueryRows.subscriptions = [healthy, failing];
		jest.spyOn(encryption, 'decryptSubscription').mockImplementation((sub: any) => {
			if (sub.id === failing.id) {
				return Promise.reject(new Error('decrypt failed'));
			}
			return Promise.resolve({ lastMessage: { t: 'e2e', e2e: 'done', msg: 'plain' } } as any);
		});

		await encryption.decryptPendingSubscriptions();

		expect(healthy._preparedState).toBeNull();
		expect(failing._preparedState).toBeNull();

		const batched = mockDbBatch.mock.calls.flatMap(call => call.flat());
		expect(batched).toContain(healthy);
		expect(healthy.lastMessage).toEqual({ t: 'e2e', e2e: 'done', msg: 'plain' });
		expect(failing.lastMessage).toEqual({ t: 'e2e', e2e: 'pending', msg: 'cipher' });
	});
});

describe('Encryption key distribution', () => {
	const db = (database as any).active;
	const KEY_DISTRIBUTION_INTERVAL = 10000;
	const distributionRuns = () => jest.mocked(db.get).mock.calls.filter(([name]: [string]) => name === 'subscriptions').length;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(db, 'get').mockImplementation(() => ({ query: () => Promise.resolve([]) }));
	});

	afterEach(() => {
		encryption.stop();
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('stops distributing room keys when the client stops', async () => {
		await encryption.initiateKeyDistribution();
		encryption.stop();

		await jest.advanceTimersByTimeAsync(KEY_DISTRIBUTION_INTERVAL);

		expect(distributionRuns()).toBe(1);
	});

	it('stops distributing room keys when the client stops during the first run', async () => {
		const firstRun = deferredSubscriptions();
		jest.mocked(db.get).mockImplementationOnce(() => ({ query: () => firstRun.promise }));

		const initiating = encryption.initiateKeyDistribution();
		encryption.stop();
		firstRun.resolve([]);
		await initiating;
		await jest.advanceTimersByTimeAsync(KEY_DISTRIBUTION_INTERVAL);

		expect(distributionRuns()).toBe(1);
	});

	it('distributes room keys right away when the client starts again after a stop', async () => {
		await encryption.initiateKeyDistribution();
		encryption.stop();

		await encryption.initiateKeyDistribution();

		expect(distributionRuns()).toBe(2);
	});
});

const deferredSubscriptions = () => {
	let resolve: (subscriptions: unknown[]) => void = () => undefined;
	const promise = new Promise<unknown[]>(r => {
		resolve = r;
	});
	return { promise, resolve };
};

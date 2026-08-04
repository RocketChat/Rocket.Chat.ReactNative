// Bypass the global mock of `app/lib/encryption` declared in jest.setup.js by
// importing directly from the file. We exercise the real `encryptMessage` here.
import encryption from './encryption';
import database from '../database';

jest.unmock('./encryption');

// Heavy native deps and helpers are not relevant to encryptMessage's branching;
// stub them so the module can be loaded in jsdom/node without a native runtime.
jest.mock('@rocket.chat/mobile-crypto', () => ({
	pbkdf2Hash: jest.fn(),
	aesEncrypt: jest.fn(),
	aesDecrypt: jest.fn(),
	randomBytes: jest.fn(),
	rsaGenerateKeys: jest.fn(),
	rsaImportKey: jest.fn(),
	rsaExportKey: jest.fn(),
	calculateFileChecksum: jest.fn(),
	aesGcmDecrypt: jest.fn(),
	aesGcmEncrypt: jest.fn()
}));

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

const mockRoomEncrypt = jest.fn();
const mockHasSessionKey = jest.fn();
const mockHandshake = jest.fn().mockResolvedValue(undefined);
jest.mock('./room', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		handshake: mockHandshake,
		hasSessionKey: () => mockHasSessionKey(),
		encrypt: (m: any) => mockRoomEncrypt(m)
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

describe('Encryption.decryptPendingMessages', () => {
	const rid = 'r1';

	// Mimics a WatermelonDB Model: prepareUpdate throws while a previous prepared
	// update has not been committed yet.
	const makeMessageRecord = (id: string) => {
		const record: any = {
			id,
			t: 'e2e',
			msg: 'cipher',
			subscription: { id: rid },
			_preparedState: null as string | null,
			prepareUpdate(recordUpdater: (m: any) => void) {
				if (record._preparedState) {
					throw new Error(`Cannot update a record with pending changes (messages#${id})`);
				}
				recordUpdater(record);
				record._preparedState = 'update';
				return record;
			}
		};
		return record;
	};

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
});

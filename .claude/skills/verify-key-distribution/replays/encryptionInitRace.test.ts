const mockPreferences = new Map<string, string>();
const mockWrites: { key: string; value: string; after: string[] }[] = [];
const mockTimeline: string[] = [];

jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn((key: string) => mockPreferences.get(key) ?? null),
		setString: jest.fn((key: string, value: string) => {
			mockPreferences.set(key, value);
			mockWrites.push({ key, value, after: [...mockTimeline] });
		}),
		removeItem: jest.fn((key: string) => mockPreferences.delete(key))
	}
}));

let mockCurrentWorkspace = 'A';
const mockUploads: { workspace: string; publicKey: string; privateKey: string }[] = [];
jest.mock('~/lib/services/restApi', () => ({
	e2eFetchMyKeys: jest.fn(),
	e2eSetUserPublicAndPrivateKeys: jest.fn((publicKey: string, privateKey: string) => {
		mockUploads.push({ workspace: mockCurrentWorkspace, publicKey, privateKey });
		return Promise.resolve({ success: true });
	}),
	e2eRequestSubscriptionKeys: jest.fn(() => Promise.resolve()),
	fetchUsersWaitingForGroupKey: jest.fn(() => Promise.resolve({ success: true, usersWaitingForE2EKeys: {} })),
	provideUsersSuggestedGroupKeys: jest.fn(() => Promise.resolve())
}));

jest.mock('@rocket.chat/mobile-crypto', () => ({
	pbkdf2Hash: jest.fn(() => Promise.resolve(Buffer.alloc(32, 1).toString('base64'))),
	aesEncrypt: jest.fn(() => Promise.resolve(Buffer.from('ciphertext').toString('base64'))),
	aesDecrypt: jest.fn(),
	aesGcmEncrypt: jest.fn(() => Promise.resolve(Buffer.from('ciphertext').toString('base64'))),
	aesGcmDecrypt: jest.fn(),
	randomBytes: jest.fn((size: number) => Promise.resolve(Buffer.alloc(size, 0).toString('base64'))),
	rsaGenerateKeys: jest.fn(),
	rsaImportKey: jest.fn(),
	rsaExportKey: jest.fn((key: string) => Promise.resolve({ kty: 'RSA', exported: key })),
	calculateFileChecksum: jest.fn(),
	aesEncryptFile: jest.fn(),
	aesDecryptFile: jest.fn()
}));

jest.mock('expo-file-system/legacy', () => ({ deleteAsync: jest.fn() }));

jest.mock('~/lib/methods/readMessages', () => ({ readMessages: jest.fn() }));

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('~/lib/methods/helpers/protectedFunction', () => ({ __esModule: true, default: (fn: any) => fn }));

jest.mock('~/lib/encryption/utils', () => ({
	...jest.requireActual('~/lib/encryption/utils'),
	generatePassphrase: jest.fn(() => Promise.resolve('random passphrase'))
}));

jest.mock('~/lib/encryption/room', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('~/lib/encryption', () => ({
	Encryption: jest.requireActual('~/lib/encryption/encryption').default
}));

const mockServersFind = jest.fn();
jest.mock('~/lib/database', () => {
	const emptyQuery = () => Object.assign([], { fetch: () => Promise.resolve([]) });
	return {
		__esModule: true,
		default: {
			servers: { get: () => ({ find: (server: string) => mockServersFind(server) }) },
			active: {
				get: () => ({ query: emptyQuery, find: () => Promise.reject(new Error('not found')) }),
				write: (callback: () => Promise<void>) => callback(),
				batch: () => Promise.resolve()
			}
		}
	};
});

import { rsaGenerateKeys, rsaImportKey } from '@rocket.chat/mobile-crypto';

import encryptionRoot from '~/sagas/encryption';
import { encryptionInit, encryptionStop } from '~/actions/encryption';
import { addSettings } from '~/actions/settings';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { ENCRYPTION } from '~/actions/actionsTypes';
import { e2eFetchMyKeys } from '~/lib/services/restApi';
import { Encryption } from '~/lib/encryption';
import { E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '~/lib/constants/keys';
import { initStore } from '~/lib/store/auxStore';
import { cancelSagaTasks, createRecordingStore } from '~/lib/testUtils/sagaStore';
import type { RecordingStore } from '~/lib/testUtils/sagaStore';

interface Pending<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
}

const pending = <T>(): Pending<T> => {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>(r => {
		resolve = r;
	});
	return { promise, resolve };
};

const settle = async () => {
	for (let pass = 0; pass < 10; pass += 1) {
		// eslint-disable-next-line no-await-in-loop
		await new Promise(resolve => setImmediate(resolve));
	}
};

const SERVER_A = 'https://a.example.com';
const SERVER_B = 'https://b.example.com';
const USER_A = { id: 'user-a', token: 'token-a', username: 'alice' };
const USER_B = { id: 'user-b', token: 'token-b', username: 'bob' };

const storeKeysFor = (server: string, owner: string) => {
	mockPreferences.set(`${server}-${E2E_PUBLIC_KEY}`, JSON.stringify({ kty: 'RSA', owner }));
	mockPreferences.set(`${server}-${E2E_PRIVATE_KEY}`, JSON.stringify({ kty: 'RSA', owner, private: true }));
};

const removeServerKeysOf = (server: string) => {
	mockTimeline.push(`removeServerKeys(${server})`);
	mockPreferences.delete(`${server}-${E2E_PUBLIC_KEY}`);
	mockPreferences.delete(`${server}-${E2E_PRIVATE_KEY}`);
	mockPreferences.delete(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
};

const signIn = (store: RecordingStore['store'], server: string, version: string, user: typeof USER_A) => {
	store.dispatch(selectServerSuccess({ server, version, name: server }));
	store.dispatch(setUser(user));
	store.dispatch(addSettings({ E2E_Enable: true } as any));
};

const stopEncryption = (store: RecordingStore['store']) => {
	mockTimeline.push('ENCRYPTION.STOP');
	store.dispatch(encryptionStop());
};

const encryptionSetsAfterLastStop = ({ dispatchedActions }: RecordingStore) => {
	const lastStop = dispatchedActions.map(action => action.type).lastIndexOf(ENCRYPTION.STOP);
	return dispatchedActions.slice(lastStop + 1).filter(action => action.type === ENCRYPTION.SET);
};

const setup = () => {
	const recording = createRecordingStore(encryptionRoot);
	initStore(recording.store);
	return recording;
};

describe('ENCRYPTION.INIT racing logout and workspace switch', () => {
	let importsByOwner: Record<string, Pending<string>>;
	let generations: Pending<{ public: string; private: string }>[];

	beforeEach(() => {
		jest.clearAllMocks();
		mockPreferences.clear();
		mockWrites.length = 0;
		mockTimeline.length = 0;
		mockUploads.length = 0;
		mockCurrentWorkspace = 'A';
		Encryption.stop();
		importsByOwner = {};
		generations = [];
		jest.mocked(rsaImportKey).mockImplementation((jwk: any) => {
			const owner = jwk.owner ?? jwk.exported;
			importsByOwner[owner] = importsByOwner[owner] ?? pending<string>();
			return importsByOwner[owner].promise as any;
		});
		jest.mocked(rsaGenerateKeys).mockImplementation(() => {
			const generation = pending<{ public: string; private: string }>();
			generations.push(generation);
			return generation.promise as any;
		});
	});

	afterEach(() => {
		cancelSagaTasks();
		Encryption.stop();
	});

	it('path 1: initialize runs and encryptionSet(true) is put after ENCRYPTION.STOP', async () => {
		const recording = setup();
		signIn(recording.store, SERVER_A, '7.0.0', USER_B);
		storeKeysFor(SERVER_A, 'B');
		const serverLookup = pending<any>();
		mockServersFind.mockReturnValue(serverLookup.promise);
		jest.mocked(e2eFetchMyKeys).mockResolvedValue({ publicKey: 'pub', privateKey: 'encoded' } as any);

		recording.store.dispatch(encryptionInit());
		await settle();
		expect(mockServersFind).toHaveBeenCalledWith(SERVER_A);

		stopEncryption(recording.store);
		await settle();
		expect(Encryption.userId).toBeNull();

		serverLookup.resolve({ E2E_Enable: true });
		await settle();
		expect(e2eFetchMyKeys).toHaveBeenCalled();
		importsByOwner.B.resolve('imported-key-B');
		await settle();

		expect(Encryption.userId).toBe(USER_B.id);
		expect(Encryption.privateKey).toBe('imported-key-B');
		expect(Encryption.keyDistributionInterval).not.toBeNull();
		expect(Encryption.ready).toBe(true);
		expect(encryptionSetsAfterLastStop(recording).map(action => action.enabled)).toContain(true);
	});

	it('path 2: persistKeys writes the private key back after logout removed it', async () => {
		const recording = setup();
		signIn(recording.store, SERVER_A, '7.0.0', USER_B);
		storeKeysFor(SERVER_A, 'B');
		mockServersFind.mockResolvedValue({ E2E_Enable: true });
		const fetchKeys = pending<any>();
		jest.mocked(e2eFetchMyKeys).mockReturnValue(fetchKeys.promise);

		recording.store.dispatch(encryptionInit());
		await settle();
		stopEncryption(recording.store);
		fetchKeys.resolve({ publicKey: 'pub', privateKey: 'encoded' });
		await settle();
		expect(rsaImportKey).toHaveBeenCalled();

		removeServerKeysOf(SERVER_A);
		importsByOwner.B.resolve('imported-key-B');
		await settle();

		const privateKeyWrite = mockWrites.find(write => write.key === `${SERVER_A}-${E2E_PRIVATE_KEY}`);
		expect(privateKeyWrite?.after).toContain(`removeServerKeys(${SERVER_A})`);
		expect(mockPreferences.get(`${SERVER_A}-${E2E_PRIVATE_KEY}`)).toContain('"owner":"B"');
		expect(mockPreferences.get(`${SERVER_A}-${E2E_PUBLIC_KEY}`)).toBeDefined();
	});

	it('path 2 (createKeys): private key and random password are written after logout removed them', async () => {
		const recording = setup();
		signIn(recording.store, SERVER_A, '7.0.0', USER_B);
		mockServersFind.mockResolvedValue({ E2E_Enable: true });
		jest.mocked(e2eFetchMyKeys).mockResolvedValue({} as any);

		recording.store.dispatch(encryptionInit());
		await settle();
		expect(generations).toHaveLength(1);

		stopEncryption(recording.store);
		removeServerKeysOf(SERVER_A);
		generations[0].resolve({ public: 'generated-public-B', private: 'generated-private-B' });
		await settle();
		importsByOwner['generated-private-B'].resolve('imported-generated-B');
		await settle();

		const writesAfterRemoval = mockWrites
			.filter(write => write.after.includes(`removeServerKeys(${SERVER_A})`))
			.map(write => write.key);
		expect(writesAfterRemoval).toEqual(
			expect.arrayContaining([`${SERVER_A}-${E2E_PRIVATE_KEY}`, `${SERVER_A}-${E2E_RANDOM_PASSWORD_KEY}`])
		);
		expect(mockPreferences.get(`${SERVER_A}-${E2E_PRIVATE_KEY}`)).toBeDefined();
		expect(mockPreferences.get(`${SERVER_A}-${E2E_RANDOM_PASSWORD_KEY}`)).toBeDefined();
		expect(mockUploads).toHaveLength(1);
	});

	const startAThenSwitchToB = async (recording: RecordingStore) => {
		signIn(recording.store, SERVER_A, '7.0.0', USER_A);
		mockServersFind.mockResolvedValue({ E2E_Enable: true });
		jest.mocked(e2eFetchMyKeys).mockResolvedValue({} as any);

		recording.store.dispatch(encryptionInit());
		await settle();
		expect(generations).toHaveLength(1);

		stopEncryption(recording.store);
		mockCurrentWorkspace = 'B';
		storeKeysFor(SERVER_B, 'B');
		jest.mocked(e2eFetchMyKeys).mockResolvedValue({ publicKey: 'pub-b', privateKey: 'encoded-b' } as any);
		signIn(recording.store, SERVER_B, '7.13.0', USER_B);
		recording.store.dispatch(encryptionInit());
		await settle();
	};

	it("path 3: A's generated keys are uploaded through workspace B's client", async () => {
		const recording = setup();
		await startAThenSwitchToB(recording);

		generations[0].resolve({ public: 'generated-public-A', private: 'generated-private-A' });
		await settle();
		importsByOwner['generated-private-A'].resolve('imported-generated-A');
		await settle();

		expect(mockUploads).toHaveLength(1);
		expect(mockUploads[0].workspace).toBe('B');
		expect(mockUploads[0].publicKey).toContain('generated-public-A');
		expect(JSON.parse(mockUploads[0].privateKey).salt).toBe(`v2:${USER_A.id}:mobile`);
		expect(mockPreferences.get(`${SERVER_A}-${E2E_RANDOM_PASSWORD_KEY}`)).toBeDefined();
		expect(mockPreferences.get(`${SERVER_A}-${E2E_PRIVATE_KEY}`)).toContain('generated-private-A');
	});

	it("path 4: A's key import overwrites B's private key after B initialized", async () => {
		const recording = setup();
		await startAThenSwitchToB(recording);

		importsByOwner.B.resolve('imported-key-B');
		await settle();
		expect(Encryption.userId).toBe(USER_B.id);
		expect(Encryption.privateKey).toBe('imported-key-B');

		generations[0].resolve({ public: 'generated-public-A', private: 'generated-private-A' });
		await settle();
		importsByOwner['generated-private-A'].resolve('imported-generated-A');
		await settle();

		expect(Encryption.userId).toBe(USER_B.id);
		expect(Encryption.privateKey).toBe('imported-generated-A');
		expect(Encryption.publicKey).toContain('generated-public-A');
	});
});

const mockPreferences = new Map<string, string>();

jest.mock('~/lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn((key: string) => mockPreferences.get(key) ?? null),
		setString: jest.fn((key: string, value: string) => mockPreferences.set(key, value)),
		removeItem: jest.fn((key: string) => {
			mockPreferences.delete(key);
		})
	}
}));

jest.mock('~/lib/services/restApi', () => ({
	e2eFetchMyKeys: jest.fn(),
	e2eSetUserPublicAndPrivateKeys: jest.fn(() => Promise.resolve({ success: true })),
	e2eRequestSubscriptionKeys: jest.fn(() => Promise.resolve({ success: true })),
	fetchUsersWaitingForGroupKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn()
}));

jest.mock('@rocket.chat/mobile-crypto', () => ({
	pbkdf2Hash: jest.fn(() => Promise.resolve('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')),
	aesEncrypt: jest.fn(() => Promise.resolve('AAAAAAAAAAAAAAAAAAAAAA==')),
	aesDecrypt: jest.fn(),
	aesGcmEncrypt: jest.fn(() => Promise.resolve('AAAAAAAAAAAAAAAAAAAAAA==')),
	aesGcmDecrypt: jest.fn(),
	randomBytes: jest.fn((size: number) => Promise.resolve(Buffer.alloc(size, 1).toString('base64'))),
	rsaGenerateKeys: jest.fn(),
	rsaImportKey: jest.fn(),
	rsaExportKey: jest.fn(),
	calculateFileChecksum: jest.fn()
}));

jest.mock('~/lib/encryption/utils', () => ({
	...jest.requireActual('~/lib/encryption/utils'),
	generatePassphrase: jest.fn(() => Promise.resolve('random passphrase'))
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: () => ({ server: { version: '7.0.0' }, encryption: { enabled: false, banner: '' } })
	}
}));

jest.unmock('~/lib/encryption');

jest.mock('~/lib/methods/readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(() => ({
				query: () => Object.assign(Promise.resolve([]), { fetch: () => Promise.resolve([]) })
			}))
		},
		servers: {
			get: jest.fn(() => ({
				find: () => Promise.reject(new Error('not found'))
			}))
		}
	}
}));

import { rsaExportKey, rsaGenerateKeys, rsaImportKey } from '@rocket.chat/mobile-crypto';

import encryptionRoot from '../encryption';
import { encryptionDecodeKey, encryptionInit, encryptionStop } from '~/actions/encryption';
import { addSettings } from '~/actions/settings';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { e2eFetchMyKeys, e2eRequestSubscriptionKeys, e2eSetUserPublicAndPrivateKeys } from '~/lib/services/restApi';
import { Encryption } from '~/lib/encryption';
import { generatePassphrase } from '~/lib/encryption/utils';
import { E2E_BANNER_TYPE, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '~/lib/constants/keys';
import { ENCRYPTION } from '~/actions/actionsTypes';
import { cancelSagaTasks, createRecordingStore } from '~/lib/testUtils/sagaStore';
import type { RecordingStore } from '~/lib/testUtils/sagaStore';

const SERVER_URL = 'https://open.rocket.chat';
const USER_A = { id: 'user-a', token: 'token-a', username: 'alice' };
const USER_B = { id: 'user-b', token: 'token-b', username: 'bob' };
const PRIVATE_KEY_STORAGE = `${SERVER_URL}-${E2E_PRIVATE_KEY}`;
const PUBLIC_KEY_STORAGE = `${SERVER_URL}-${E2E_PUBLIC_KEY}`;
const RANDOM_PASSWORD_STORAGE = `${SERVER_URL}-${E2E_RANDOM_PASSWORD_KEY}`;

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(promiseResolve => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
};

const drainEventLoop = async (passes = 50): Promise<void> => {
	if (passes === 0) {
		return;
	}
	await new Promise(resolve => setImmediate(resolve));
	await drainEventLoop(passes - 1);
};

type TMyKeys = Awaited<ReturnType<typeof e2eFetchMyKeys>>;
const NO_KEYS: TMyKeys = { success: true, publicKey: '', privateKey: '' };
const SERVER_KEYS: TMyKeys = { success: true, publicKey: 'server-public', privateKey: 'server-private' };

const signIn = (store: RecordingStore['store'], user: typeof USER_A) => {
	store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.0.0', name: 'Open' }));
	store.dispatch(setUser(user));
	store.dispatch(addSettings({ E2E_Enable: true }));
	store.dispatch(encryptionInit());
};

const simulateLogoutCleanup = (store: RecordingStore['store']) => {
	store.dispatch(encryptionStop());
	mockPreferences.delete(PUBLIC_KEY_STORAGE);
	mockPreferences.delete(PRIVATE_KEY_STORAGE);
	mockPreferences.delete(RANDOM_PASSWORD_STORAGE);
};

const keyPairFor = (label: string) => ({
	public: `${label}-public-pem`,
	private: `${label}-private-pem`
});

const stubKeyCrypto = () => {
	jest.mocked(rsaExportKey).mockImplementation((pem: string) => Promise.resolve({ kty: 'RSA', n: pem, e: 'AQAB' }));
	jest.mocked(rsaImportKey).mockImplementation((jwk: { n: string }) => Promise.resolve(`imported:${jwk.n}`));
};

describe('encryption saga — sign-out while ENCRYPTION.INIT is in flight', () => {
	beforeEach(() => {
		mockPreferences.clear();
		jest.clearAllMocks();
		Encryption.stop();
		stubKeyCrypto();
	});

	afterEach(() => {
		cancelSagaTasks();
	});

	it('creates, stores and uploads keys when nobody signs out', async () => {
		const fetchA = createDeferred<TMyKeys>();
		const generateA = createDeferred<ReturnType<typeof keyPairFor>>();
		jest.mocked(e2eFetchMyKeys).mockReturnValueOnce(fetchA.promise);
		jest.mocked(rsaGenerateKeys).mockReturnValueOnce(generateA.promise);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		fetchA.resolve(NO_KEYS);
		await drainEventLoop();
		generateA.resolve(keyPairFor('A'));
		await drainEventLoop();

		expect(mockPreferences.get(PRIVATE_KEY_STORAGE)).toContain('A-private-pem');
		expect(mockPreferences.has(RANDOM_PASSWORD_STORAGE)).toBe(true);
		expect(Encryption.privateKey).toBe('imported:A-private-pem');
		expect(e2eSetUserPublicAndPrivateKeys).toHaveBeenCalledTimes(1);
		expect(store.getState().encryption.enabled).toBe(true);
		expect(Encryption.userId).toBe(USER_A.id);
	});

	it('does not show the password banner when the key fetch resolves after sign-out', async () => {
		const fetchA = createDeferred<TMyKeys>();
		jest.mocked(e2eFetchMyKeys).mockReturnValueOnce(fetchA.promise);
		const { store, dispatchedActions } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		expect(e2eFetchMyKeys).toHaveBeenCalledTimes(1);

		store.dispatch(encryptionStop());
		await drainEventLoop();
		fetchA.resolve(SERVER_KEYS);
		await drainEventLoop();

		expect(dispatchedActions).not.toContainEqual(expect.objectContaining({ banner: E2E_BANNER_TYPE.REQUEST_PASSWORD }));
		expect(store.getState().encryption.banner).toBe('');
	});

	it('does not store, upload or arm keys created after sign-out removed them', async () => {
		const fetchA = createDeferred<TMyKeys>();
		const generateA = createDeferred<ReturnType<typeof keyPairFor>>();
		jest.mocked(e2eFetchMyKeys).mockReturnValueOnce(fetchA.promise);
		jest.mocked(rsaGenerateKeys).mockReturnValueOnce(generateA.promise);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		fetchA.resolve(NO_KEYS);
		await drainEventLoop();
		expect(rsaGenerateKeys).toHaveBeenCalledTimes(1);

		simulateLogoutCleanup(store);
		await drainEventLoop();
		generateA.resolve(keyPairFor('A'));
		await drainEventLoop();

		expect(mockPreferences.has(PRIVATE_KEY_STORAGE)).toBe(false);
		expect(mockPreferences.has(PUBLIC_KEY_STORAGE)).toBe(false);
		expect(mockPreferences.has(RANDOM_PASSWORD_STORAGE)).toBe(false);
		expect(Encryption.privateKey).toBeNull();
		expect(e2eSetUserPublicAndPrivateKeys).not.toHaveBeenCalled();
		expect(store.getState().encryption.enabled).toBe(false);
		expect(Encryption.userId).toBeNull();
		expect(Encryption.keyDistributionInterval).toBeNull();
		expect(Encryption.ready).toBe(false);
	});

	it("does not post the previous user's keys after the next user signs in", async () => {
		const fetchA = createDeferred<TMyKeys>();
		const fetchB = createDeferred<TMyKeys>();
		const generateA = createDeferred<ReturnType<typeof keyPairFor>>();
		jest.mocked(e2eFetchMyKeys).mockReturnValueOnce(fetchA.promise).mockReturnValueOnce(fetchB.promise);
		jest.mocked(rsaGenerateKeys).mockReturnValueOnce(generateA.promise);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		fetchA.resolve(NO_KEYS);
		await drainEventLoop();
		simulateLogoutCleanup(store);
		await drainEventLoop();

		signIn(store, USER_B);
		await drainEventLoop();
		generateA.resolve(keyPairFor('A'));
		await drainEventLoop();

		expect(e2eSetUserPublicAndPrivateKeys).not.toHaveBeenCalled();
		expect(mockPreferences.has(PRIVATE_KEY_STORAGE)).toBe(false);
		expect(Encryption.privateKey).toBeNull();
	});

	it('does not store keys from a setup replaced by a newer one', async () => {
		const generateFirst = createDeferred<ReturnType<typeof keyPairFor>>();
		jest
			.mocked(e2eFetchMyKeys)
			.mockResolvedValueOnce(NO_KEYS)
			.mockReturnValueOnce(new Promise(() => {}));
		jest.mocked(rsaGenerateKeys).mockReturnValueOnce(generateFirst.promise);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		expect(rsaGenerateKeys).toHaveBeenCalledTimes(1);

		store.dispatch(encryptionInit());
		await drainEventLoop();
		generateFirst.resolve(keyPairFor('first'));
		await drainEventLoop();

		expect(mockPreferences.has(PRIVATE_KEY_STORAGE)).toBe(false);
		expect(e2eSetUserPublicAndPrivateKeys).not.toHaveBeenCalled();
	});

	it('uploads the keys a replaced setup stored but never uploaded', async () => {
		const firstPassphrase = createDeferred<string>();
		jest.mocked(e2eFetchMyKeys).mockResolvedValueOnce(NO_KEYS).mockResolvedValueOnce(NO_KEYS);
		jest.mocked(rsaGenerateKeys).mockResolvedValueOnce(keyPairFor('A'));
		jest.mocked(generatePassphrase).mockReturnValueOnce(firstPassphrase.promise);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		expect(mockPreferences.get(PRIVATE_KEY_STORAGE)).toContain('A-private-pem');

		store.dispatch(encryptionInit());
		await drainEventLoop();
		firstPassphrase.resolve('first passphrase');
		await drainEventLoop();

		expect(rsaGenerateKeys).toHaveBeenCalledTimes(1);
		expect(e2eSetUserPublicAndPrivateKeys).toHaveBeenCalledTimes(1);
		expect(jest.mocked(e2eSetUserPublicAndPrivateKeys).mock.calls[0][0]).toContain('A-public-pem');
		expect(e2eRequestSubscriptionKeys).toHaveBeenCalledTimes(1);
		expect(mockPreferences.get(RANDOM_PASSWORD_STORAGE)).toBe('random passphrase');
		expect(store.getState().encryption.enabled).toBe(true);
		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.SAVE_PASSWORD);
	});

	it('requests room keys when a newer setup replaces it during the upload', async () => {
		const upload = createDeferred<void>();
		jest
			.mocked(e2eFetchMyKeys)
			.mockResolvedValueOnce(NO_KEYS)
			.mockReturnValueOnce(new Promise(() => {}));
		jest.mocked(rsaGenerateKeys).mockResolvedValueOnce(keyPairFor('A'));
		jest
			.mocked(e2eSetUserPublicAndPrivateKeys)
			.mockReturnValueOnce(upload.promise as ReturnType<typeof e2eSetUserPublicAndPrivateKeys>);
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		expect(e2eSetUserPublicAndPrivateKeys).toHaveBeenCalledTimes(1);

		store.dispatch(encryptionInit());
		await drainEventLoop();
		upload.resolve();
		await drainEventLoop();

		expect(e2eRequestSubscriptionKeys).toHaveBeenCalledTimes(1);
	});

	it('keeps the password of an upload still in flight when a newer setup uploads the keys again', async () => {
		const firstUpload = createDeferred<void>();
		jest.mocked(e2eFetchMyKeys).mockResolvedValueOnce(NO_KEYS).mockResolvedValueOnce(NO_KEYS);
		jest.mocked(rsaGenerateKeys).mockResolvedValueOnce(keyPairFor('A'));
		jest.mocked(generatePassphrase).mockResolvedValueOnce('first passphrase');
		jest
			.mocked(e2eSetUserPublicAndPrivateKeys)
			.mockReturnValueOnce(firstUpload.promise as ReturnType<typeof e2eSetUserPublicAndPrivateKeys>)
			.mockRejectedValueOnce(new Error('error-keys-already-set'));
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();
		expect(e2eSetUserPublicAndPrivateKeys).toHaveBeenCalledTimes(1);

		store.dispatch(encryptionInit());
		await drainEventLoop();
		firstUpload.resolve();
		await drainEventLoop();

		const [firstCall, secondCall] = jest.mocked(e2eSetUserPublicAndPrivateKeys).mock.calls;
		expect(secondCall).toEqual(firstCall);
		expect(generatePassphrase).toHaveBeenCalledTimes(1);
		expect(mockPreferences.get(RANDOM_PASSWORD_STORAGE)).toBe('first passphrase');
		expect(store.getState().encryption.banner).toBe(E2E_BANNER_TYPE.SAVE_PASSWORD);
	});

	it('enables E2EE with the stored keys when uploading them fails', async () => {
		mockPreferences.set(PUBLIC_KEY_STORAGE, JSON.stringify({ kty: 'RSA', n: 'A-public-pem', e: 'AQAB' }));
		mockPreferences.set(PRIVATE_KEY_STORAGE, JSON.stringify({ kty: 'RSA', n: 'A-private-pem', e: 'AQAB' }));
		jest.mocked(e2eFetchMyKeys).mockResolvedValueOnce(NO_KEYS);
		jest.mocked(e2eSetUserPublicAndPrivateKeys).mockRejectedValueOnce(new Error('Network request failed'));
		const { store } = createRecordingStore(encryptionRoot);

		signIn(store, USER_A);
		await drainEventLoop();

		expect(e2eSetUserPublicAndPrivateKeys).toHaveBeenCalledTimes(1);
		expect(Encryption.privateKey).toBe('imported:A-private-pem');
		expect(store.getState().encryption.enabled).toBe(true);
		expect(Encryption.userId).toBe(USER_A.id);
	});
});

describe('encryption saga — sign-out while ENCRYPTION.DECODE_KEY is in flight', () => {
	beforeEach(() => {
		mockPreferences.clear();
		jest.clearAllMocks();
		Encryption.stop();
		stubKeyCrypto();
	});

	afterEach(() => {
		cancelSagaTasks();
		jest.restoreAllMocks();
	});

	const submitPasswordUntilDecoding = async (store: RecordingStore['store']) => {
		const decoding = createDeferred<string>();
		jest.mocked(e2eFetchMyKeys).mockResolvedValueOnce({ ...SERVER_KEYS, publicKey: '{"kty":"RSA"}' });
		jest.spyOn(Encryption, 'decodePrivateKey').mockReturnValueOnce(decoding.promise);
		store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.0.0', name: 'Open' }));
		store.dispatch(setUser(USER_A));
		store.dispatch(encryptionDecodeKey('password'));
		await drainEventLoop();
		expect(Encryption.decodePrivateKey).toHaveBeenCalledTimes(1);
		return decoding;
	};

	it('stores the decoded keys and enables E2EE when nobody signs out', async () => {
		const { store } = createRecordingStore(encryptionRoot);

		const decoding = await submitPasswordUntilDecoding(store);
		decoding.resolve('{"n":"A-private-pem"}');
		await drainEventLoop();

		expect(mockPreferences.get(PRIVATE_KEY_STORAGE)).toContain('A-private-pem');
		expect(Encryption.userId).toBe(USER_A.id);
		expect(store.getState().encryption.enabled).toBe(true);
	});

	it('neither stores the keys nor reports a wrong password when sign-out lands during decoding', async () => {
		const { store, dispatchedActions } = createRecordingStore(encryptionRoot);

		const decoding = await submitPasswordUntilDecoding(store);
		simulateLogoutCleanup(store);
		await drainEventLoop();
		decoding.resolve('{"n":"A-private-pem"}');
		await drainEventLoop();

		expect(mockPreferences.has(PRIVATE_KEY_STORAGE)).toBe(false);
		expect(Encryption.privateKey).toBeNull();
		expect(Encryption.userId).toBeNull();
		expect(dispatchedActions).not.toContainEqual(expect.objectContaining({ type: ENCRYPTION.DECODE_KEY_FAILURE }));
		expect(store.getState().encryption.failure).toBe(false);
	});

	it('neither stores the keys nor reports a wrong password when sign-out lands during key import', async () => {
		const importing = createDeferred<string>();
		jest.mocked(rsaImportKey).mockReturnValueOnce(importing.promise);
		const { store, dispatchedActions } = createRecordingStore(encryptionRoot);

		const decoding = await submitPasswordUntilDecoding(store);
		decoding.resolve('{"n":"A-private-pem"}');
		await drainEventLoop();
		expect(rsaImportKey).toHaveBeenCalledTimes(1);

		simulateLogoutCleanup(store);
		await drainEventLoop();
		importing.resolve('imported:A-private-pem');
		await drainEventLoop();

		expect(mockPreferences.has(PRIVATE_KEY_STORAGE)).toBe(false);
		expect(Encryption.privateKey).toBeNull();
		expect(dispatchedActions).not.toContainEqual(expect.objectContaining({ type: ENCRYPTION.DECODE_KEY_FAILURE }));
	});
});

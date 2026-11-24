jest.mock('~/lib/services/restApi', () => ({
	e2eFetchMyKeys: jest.fn()
}));

jest.mock('~/lib/methods/readMessages', () => ({
	readMessages: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/encryption', () => ({
	Encryption: {
		initialize: jest.fn(),
		persistKeys: jest.fn(),
		decodePrivateKey: jest.fn(),
		stop: jest.fn()
	}
}));

import encryptionRoot from '../encryption';
import { encryptionDecodeKey } from '~/actions/encryption';
import { ENCRYPTION } from '~/actions/actionsTypes';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { e2eFetchMyKeys } from '~/lib/services/restApi';
import { Encryption } from '~/lib/encryption';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

const SERVER_URL = 'https://open.rocket.chat';
const USER = { id: 'user-1', token: 'token-1', username: 'diego' };
const PUBLIC_KEY = '{"kty":"RSA","n":"modulus","e":"AQAB"}';

const decodeKeyWithServerKeys = async (keys: { publicKey?: string; privateKey: string }) => {
	jest.mocked(e2eFetchMyKeys).mockResolvedValue(keys as any);
	const recording = createRecordingStore(encryptionRoot);
	recording.store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.13.0', name: 'Open' }));
	recording.store.dispatch(setUser(USER));
	recording.store.dispatch(encryptionDecodeKey('password'));
	await flushSagaMicrotasks();
	return recording;
};

describe('encryption saga — decoding the private key with the E2EE password', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(Encryption.decodePrivateKey).mockResolvedValue('decoded-private-key');
	});

	afterEach(() => {
		cancelSagaTasks();
	});

	it('persists the server public key with the decoded private key', async () => {
		const { store } = await decodeKeyWithServerKeys({ publicKey: PUBLIC_KEY, privateKey: 'encoded-private-key' });

		expect(Encryption.decodePrivateKey).toHaveBeenCalledWith('encoded-private-key', 'password', USER.id);
		expect(Encryption.persistKeys).toHaveBeenCalledWith(SERVER_URL, PUBLIC_KEY, 'decoded-private-key');
		expect(store.getState().encryption.enabled).toBe(true);
	});

	it('fails without storing keys when the server has no public key', async () => {
		const { dispatchedActions } = await decodeKeyWithServerKeys({ privateKey: 'encoded-private-key' });

		expect(Encryption.persistKeys).not.toHaveBeenCalled();
		expect(Encryption.initialize).not.toHaveBeenCalled();
		expect(dispatchedActions.map(action => action.type)).toContain(ENCRYPTION.DECODE_KEY_FAILURE);
	});
});

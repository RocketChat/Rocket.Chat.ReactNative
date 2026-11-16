jest.mock('~/lib/encryption', () => ({
	Encryption: jest.requireActual('~/lib/encryption/encryption').default
}));

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

import { waitFor } from '@testing-library/react-native';

import encryptionRoot from '../encryption';
import { encryptionDecodeKey } from '~/actions/encryption';
import { ENCRYPTION } from '~/actions/actionsTypes';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import UserPreferences from '~/lib/methods/userPreferences';
import { e2eFetchMyKeys } from '~/lib/services/restApi';
import { E2E_PRIVATE_KEY, E2E_PUBLIC_KEY } from '~/lib/constants/keys';
import { Encryption } from '~/lib/encryption';
import { cancelSagaTasks, createRecordingStore } from '~/lib/testUtils/sagaStore';
import user from '~/lib/encryption/__tests__/fixtures/user.json';

const SERVER_URL = 'https://open.rocket.chat';
const STORED_PUBLIC_KEY = 'stored-public-key';
const STORED_PRIVATE_KEY = 'stored-private-key';
const DECODE_OUTCOMES = [ENCRYPTION.SET, ENCRYPTION.DECODE_KEY_FAILURE];

const storedKeys = () => ({
	publicKey: UserPreferences.getString(`${SERVER_URL}-${E2E_PUBLIC_KEY}`),
	privateKey: UserPreferences.getString(`${SERVER_URL}-${E2E_PRIVATE_KEY}`)
});

const decodeKey = async (encodedPrivateKey: string, password: string) => {
	jest.mocked(e2eFetchMyKeys).mockResolvedValue({ publicKey: user.publicKey, privateKey: encodedPrivateKey } as any);
	const { store, dispatchedActions } = createRecordingStore(encryptionRoot);
	store.dispatch(selectServerSuccess({ server: SERVER_URL, version: '7.13.0', name: 'Open' }));
	store.dispatch(setUser({ id: user.userId, token: 'token', username: 'web-fixture-user' }));
	store.dispatch(encryptionDecodeKey(password));
	await waitFor(() => expect(dispatchedActions.some(({ type }) => DECODE_OUTCOMES.includes(type))).toBe(true));
	return dispatchedActions;
};

describe('encryption saga — decoding the private key with the E2E password', () => {
	beforeEach(() => {
		jest.spyOn(Encryption, 'initialize').mockImplementation(() => {});
		UserPreferences.setString(`${SERVER_URL}-${E2E_PUBLIC_KEY}`, STORED_PUBLIC_KEY);
		UserPreferences.setString(`${SERVER_URL}-${E2E_PRIVATE_KEY}`, STORED_PRIVATE_KEY);
	});

	afterEach(() => {
		cancelSagaTasks();
	});

	it.each([
		['v1', user.encodedPrivateKeyV1],
		['v2', user.encodedPrivateKeyV2]
	])('stores the decoded %s private key when the password is right', async (_version, encodedPrivateKey) => {
		const dispatchedActions = await decodeKey(encodedPrivateKey, user.password);

		expect(dispatchedActions).toContainEqual(expect.objectContaining({ type: ENCRYPTION.SET, enabled: true }));
		expect(storedKeys()).toEqual({ publicKey: user.publicKey, privateKey: user.privateKey });
	});

	it.each([
		['v1', user.encodedPrivateKeyV1],
		['v2', user.encodedPrivateKeyV2]
	])(
		'fails and leaves the stored keys untouched when the %s private key password is wrong',
		async (_version, encodedPrivateKey) => {
			const dispatchedActions = await decodeKey(encodedPrivateKey, 'not the password');

			expect(dispatchedActions).toContainEqual({ type: ENCRYPTION.DECODE_KEY_FAILURE });
			expect(storedKeys()).toEqual({ publicKey: STORED_PUBLIC_KEY, privateKey: STORED_PRIVATE_KEY });
		}
	);
});

// Bypass the global mock of `app/lib/encryption` declared in jest.setup.js by
// importing directly from the file. We exercise the real `encryptMessage` here.
import encryption from './encryption';

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
jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ find: (rid: string) => mockSubFind(rid) })
		}
	}
}));

const mockRoomEncrypt = jest.fn();
const mockRoomDecrypt = jest.fn();
const mockHasSessionKey = jest.fn();
const mockHandshake = jest.fn().mockResolvedValue(undefined);
jest.mock('./room', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({
		handshake: mockHandshake,
		hasSessionKey: () => mockHasSessionKey(),
		encrypt: (m: any) => mockRoomEncrypt(m),
		decrypt: (m: any) => mockRoomDecrypt(m)
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

	describe('decryptMessages', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			(encryption as any).roomInstances = {};
		});

		it('returns successfully decrypted messages when one fails (was Promise.all that aborted the batch)', async () => {
			const good = { _id: 'm1', rid: 'r1', msg: 'good', t: 'e2e' } as any;
			const bad = { _id: 'm2', rid: 'r2', msg: 'bad', t: 'e2e' } as any;
			mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
			mockHasSessionKey.mockReturnValue(true);
			mockRoomDecrypt.mockResolvedValueOnce({ ...good, msg: 'decrypted' });
			mockRoomDecrypt.mockRejectedValueOnce(new Error('decrypt failed'));
			// getRoomInstance creates a new EncryptionRoom for each rid via the mock
			mockSubFind.mockResolvedValue({ encrypted: true });

			const result = await encryption.decryptMessages([good, bad]);

			expect(mockRoomDecrypt).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(1);
			expect(result[0]._id).toBe('m1');
			expect(result[0].msg).toBe('decrypted');
		});

		it('returns empty array when ALL messages fail decryption (does not throw)', async () => {
			const msgs = [
				{ _id: 'm1', rid: 'r1', msg: 'bad1', t: 'e2e' },
				{ _id: 'm2', rid: 'r2', msg: 'bad2', t: 'e2e' }
			] as any;
			mockGetState.mockReturnValue({ settings: { E2E_Enable: true } });
			mockHasSessionKey.mockReturnValue(true);
			mockRoomDecrypt.mockRejectedValue(new Error('decrypt failed'));
			mockSubFind.mockResolvedValue({ encrypted: true });

			const result = await encryption.decryptMessages(msgs);

			expect(mockRoomDecrypt).toHaveBeenCalledTimes(2);
			expect(result).toEqual([]);
		});

		it('returns all messages unchanged for non-E2E room (short-circuits decryptMessage)', async () => {
			const msgs = [
				{ _id: 'm1', rid: 'r1', msg: 'hello' },
				{ _id: 'm2', rid: 'r2', msg: 'world' }
			] as any;

			const result = await encryption.decryptMessages(msgs);

			expect(result).toHaveLength(2);
			expect(mockRoomDecrypt).not.toHaveBeenCalled();
		});
	});
});

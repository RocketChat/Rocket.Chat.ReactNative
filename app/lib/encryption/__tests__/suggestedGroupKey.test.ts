import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import Encryption from '../encryption';
import { e2eAcceptSuggestedGroupKey, e2eRejectSuggestedGroupKey } from '../../services/restApi';
import { type TAppDatabase } from '../../database/interfaces';
import { type IMessage } from '~/definitions';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
import { webClientDecryptText } from '../../testUtils/e2eeWebClient';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

let mockDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('../../services/restApi', () => ({
	...jest.requireActual('../../services/restApi'),
	fetchUsersWaitingForGroupKey: jest.fn(() => Promise.resolve({ success: true, usersWaitingForE2EKeys: {} })),
	e2eAcceptSuggestedGroupKey: jest.fn(),
	e2eRejectSuggestedGroupKey: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({
			server: { version: '7.13.0' },
			settings: { E2E_Enable: true },
			encryption: { enabled: true, banner: '' }
		})
	}
}));

const SERVER = 'https://open.rocket.chat';
const ROOM_ID = 'room-id';
const PLAINTEXT = 'which key encrypted me?';

const encryptInRoom = () => Encryption.encryptMessage({ _id: 'message-id', rid: ROOM_ID, msg: PLAINTEXT } as IMessage);

beforeEach(async () => {
	jest.clearAllMocks();
	mockDatabase = createInMemoryAppDatabase();
	await mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: ROOM_ID }, subscriptions.schema);
			subscription.rid = ROOM_ID;
			subscription.encrypted = true;
			subscription.E2EKey = roomKeys.v1.E2EKey;
			subscription.e2eKeyId = roomKeys.v1.keyID;
			subscription.E2ESuggestedKey = roomKeys.v2.E2EKey;
		});
	});
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
});

afterEach(() => {
	Encryption.stop();
});

describe('a suggested room key', () => {
	it('is accepted and used to encrypt when the server accepts it', async () => {
		jest.mocked(e2eAcceptSuggestedGroupKey).mockResolvedValue({ success: true });

		const encrypted = await encryptInRoom();

		expect(e2eAcceptSuggestedGroupKey).toHaveBeenCalledWith(ROOM_ID);
		expect(e2eRejectSuggestedGroupKey).not.toHaveBeenCalled();
		expect(encrypted?.content).toMatchObject({ algorithm: 'rc.v2.aes-sha2', kid: roomKeys.v2.keyID });
		await expect(webClientDecryptText(roomKeys.v2.sessionKeyExportedString, encrypted?.content)).resolves.toMatchObject({
			msg: PLAINTEXT
		});
	});

	it('is rejected, and the current room key is used instead, when accepting it fails', async () => {
		jest.mocked(e2eAcceptSuggestedGroupKey).mockRejectedValue(new Error('accept failed'));

		const encrypted = await encryptInRoom();

		expect(e2eRejectSuggestedGroupKey).toHaveBeenCalledWith(ROOM_ID);
		expect(encrypted?.content).toMatchObject({ algorithm: 'rc.v1.aes-sha2' });
		expect(encrypted?.content?.ciphertext.startsWith(roomKeys.v1.keyID)).toBe(true);
		await expect(webClientDecryptText(roomKeys.v1.sessionKeyExportedString, encrypted?.content)).resolves.toMatchObject({
			msg: PLAINTEXT
		});
	});
});

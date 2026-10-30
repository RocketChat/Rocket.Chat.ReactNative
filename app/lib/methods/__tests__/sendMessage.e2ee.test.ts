import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { editMessage } from '../editMessage';
import { resendMessage, sendMessage } from '../sendMessage';
import { Encryption } from '../../encryption';
import sdk from '../../services/sdk';
import { messagesStatus } from '../../constants/messagesStatus';
import { type TAppDatabase } from '../../database/interfaces';
import { type IMessage, type TMessageModel } from '~/definitions';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
import { webClientDecryptText } from '../../testUtils/e2eeWebClient';
import roomKeys from '../../encryption/__tests__/fixtures/roomKeys.json';
import user from '../../encryption/__tests__/fixtures/user.json';

jest.unmock('../../encryption');

let mockDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: { post: jest.fn(), get: jest.fn(), methodCallWrapper: jest.fn() }
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
const MESSAGE_ID = 'message-id';
const PLAINTEXT = 'meet me at the usual place';
const sender = { id: user.userId, username: 'sender', name: 'Sender' };

const seedEncryptedRoom = ({ withRoomKey }: { withRoomKey: boolean }) =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: ROOM_ID }, subscriptions.schema);
			subscription.rid = ROOM_ID;
			subscription.encrypted = true;
			subscription.E2EKey = withRoomKey ? roomKeys.v2.E2EKey : undefined;
			subscription.e2eKeyId = roomKeys.v2.keyID;
		});
	});

const seedFailedMessage = () =>
	mockDatabase.write(async () => {
		const messages = mockDatabase.get('messages');
		return messages.create(message => {
			message._raw = sanitizedRaw({ id: MESSAGE_ID, rid: ROOM_ID }, messages.schema);
			message.msg = PLAINTEXT;
			message.status = messagesStatus.ERROR;
		});
	});

const storedMessages = () => mockDatabase.get('messages').query().fetch();

const postsTo = (endpoint: string) =>
	jest
		.mocked(sdk.post)
		.mock.calls.filter(([calledEndpoint]) => calledEndpoint === endpoint)
		.map(([, params]) => params as unknown as Record<string, any>);

const postedMessage = (): IMessage => {
	const posts = postsTo('chat.sendMessage');
	expect(posts).toHaveLength(1);
	return posts[0].message;
};

const decrypt = (content: IMessage['content']) => webClientDecryptText(roomKeys.v2.sessionKeyExportedString, content);

beforeEach(async () => {
	jest.clearAllMocks();
	jest
		.mocked(sdk.post)
		.mockImplementation((async (endpoint: string, params: { message?: IMessage }) =>
			endpoint === 'chat.sendMessage' ? { success: true, message: params.message } : { success: true }) as any);
	mockDatabase = createInMemoryAppDatabase();
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
});

afterEach(() => {
	Object.values(Encryption.roomInstances).forEach(room => (room.requestRoomKey as unknown as { stop: () => void }).stop());
	Encryption.stop();
});

describe('in an encrypted room with the room key', () => {
	beforeEach(() => seedEncryptedRoom({ withRoomKey: true }));

	it('sendMessage posts ciphertext the web client decrypts, never the plaintext', async () => {
		await sendMessage(ROOM_ID, PLAINTEXT, undefined, sender);

		const posted = postedMessage();
		expect(posted).toMatchObject({ rid: ROOM_ID, t: 'e2e' });
		expect(posted).not.toHaveProperty('msg');
		await expect(decrypt(posted.content)).resolves.toMatchObject({ msg: PLAINTEXT });
	});

	it('resendMessage posts ciphertext the web client decrypts, never the plaintext', async () => {
		const failedMessage = await seedFailedMessage();

		await resendMessage(failedMessage as TMessageModel);

		const posted = postedMessage();
		expect(posted).toMatchObject({ _id: MESSAGE_ID, rid: ROOM_ID, t: 'e2e' });
		expect(posted).not.toHaveProperty('msg');
		await expect(decrypt(posted.content)).resolves.toMatchObject({ msg: PLAINTEXT });
	});

	it('editMessage posts ciphertext the web client decrypts, never the plaintext', async () => {
		await editMessage({ id: MESSAGE_ID, rid: ROOM_ID, msg: PLAINTEXT });

		const updates = postsTo('chat.update');
		expect(updates).toHaveLength(1);
		expect(updates[0]).toMatchObject({ roomId: ROOM_ID, msgId: MESSAGE_ID });
		expect(updates[0]).not.toHaveProperty('text');
		await expect(decrypt(updates[0].content)).resolves.toMatchObject({ msg: PLAINTEXT });
	});
});

describe('in an encrypted room whose key has not arrived', () => {
	beforeEach(() => seedEncryptedRoom({ withRoomKey: false }));

	it('sendMessage posts nothing and leaves the message in ERROR so the user can retry', async () => {
		await sendMessage(ROOM_ID, PLAINTEXT, undefined, sender);

		expect(postsTo('chat.sendMessage')).toEqual([]);
		expect((await storedMessages()).map(({ status }) => status)).toEqual([messagesStatus.ERROR]);
	});

	it('resendMessage posts nothing and puts the message back in ERROR', async () => {
		const failedMessage = await seedFailedMessage();

		await resendMessage(failedMessage as TMessageModel);

		expect(postsTo('chat.sendMessage')).toEqual([]);
		expect((await storedMessages()).map(({ status }) => status)).toEqual([messagesStatus.ERROR]);
	});

	it('editMessage posts nothing and rejects', async () => {
		await expect(editMessage({ id: MESSAGE_ID, rid: ROOM_ID, msg: PLAINTEXT })).rejects.toThrow('Failed to encrypt message');

		expect(postsTo('chat.update')).toEqual([]);
	});
});

import { rsaImportKey } from '@rocket.chat/mobile-crypto';

import EncryptionRoom from '../room';
import { type IEncryption } from '../definitions';
import { type IMessage, type TSubscriptionModel } from '~/definitions';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import messages from './fixtures/messages.json';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

jest.mock('../../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.13.0' }, settings: {} }) }
}));

type TRoomKey = typeof roomKeys.v1;

const { subtle } = globalThis.crypto;

const createReadyRoom = async (roomKey: TRoomKey) => {
	(getSubscriptionByRoomId as jest.Mock).mockResolvedValue({
		encrypted: true,
		E2EKey: roomKey.E2EKey,
		e2eKeyId: roomKey.keyID
	} as unknown as TSubscriptionModel);
	const encryption: IEncryption = {
		privateKey: await rsaImportKey(JSON.parse(user.privateKey)),
		publicKey: user.publicKey,
		deleteRoomInstance: jest.fn()
	};
	const room = new EncryptionRoom('room-id', user.userId, encryption);
	await room.handshake();
	expect(room.ready).toBe(true);
	return room;
};

const pendingMessage = (content: IMessage['content']) =>
	({ _id: 'message-id', rid: 'room-id', t: 'e2e', e2e: 'pending', content }) as unknown as IMessage;

const webClientDecrypt = async ({ sessionKeyExportedString }: TRoomKey, content: IMessage['content']) => {
	const jwk = JSON.parse(sessionKeyExportedString);
	const name = jwk.alg === 'A256GCM' ? 'AES-GCM' : 'AES-CBC';
	const key = await subtle.importKey('jwk', jwk, { name }, false, ['decrypt']);
	const payload =
		content?.algorithm === 'rc.v2.aes-sha2'
			? { iv: Buffer.from(content.iv, 'base64'), ciphertext: Buffer.from(content.ciphertext, 'base64') }
			: {
					iv: Buffer.from(content?.ciphertext.slice(12) ?? '', 'base64').subarray(0, 16),
					ciphertext: Buffer.from(content?.ciphertext.slice(12) ?? '', 'base64').subarray(16)
				};
	const decrypted = await subtle.decrypt({ name, iv: payload.iv }, key, payload.ciphertext);
	return JSON.parse(new TextDecoder().decode(decrypted));
};

describe('message encryption', () => {
	it('encrypts with a v1 room key in a form the web client and itself decrypt', async () => {
		const room = await createReadyRoom(roomKeys.v1);

		const encrypted = await room.encrypt({ _id: 'message-id', rid: 'room-id', msg: messages.plaintext.msg } as IMessage);

		expect(encrypted).toMatchObject({ t: 'e2e', e2e: 'pending' });
		expect(encrypted.msg).toBeUndefined();
		expect(encrypted.content).toEqual({
			algorithm: 'rc.v1.aes-sha2',
			ciphertext: expect.stringMatching(new RegExp(`^${roomKeys.v1.keyID}`))
		});
		await expect(webClientDecrypt(roomKeys.v1, encrypted.content)).resolves.toEqual(messages.plaintext);
		expect(await room.decrypt(encrypted)).toMatchObject({ msg: messages.plaintext.msg, e2e: 'done' });
	});

	it('encrypts with a v2 room key in a form the web client and itself decrypt', async () => {
		const room = await createReadyRoom(roomKeys.v2);

		const encrypted = await room.encrypt({ _id: 'message-id', rid: 'room-id', msg: messages.plaintext.msg } as IMessage);

		expect(encrypted).toMatchObject({ t: 'e2e', e2e: 'pending' });
		expect(encrypted.msg).toBeUndefined();
		expect(encrypted.content).toEqual({
			algorithm: 'rc.v2.aes-sha2',
			kid: roomKeys.v2.keyID,
			iv: expect.any(String),
			ciphertext: expect.any(String)
		});
		expect(Buffer.from((encrypted.content as { iv: string }).iv, 'base64')).toHaveLength(12);
		await expect(webClientDecrypt(roomKeys.v2, encrypted.content)).resolves.toEqual(messages.plaintext);
		expect(await room.decrypt(encrypted)).toMatchObject({ msg: messages.plaintext.msg, e2e: 'done' });
	});

	it.each([
		['v1', roomKeys.v1, messages.v1],
		['v2', roomKeys.v2, messages.v2]
	])('decrypts a %s message encrypted by the web client', async (_version, roomKey, content) => {
		const room = await createReadyRoom(roomKey);

		const decrypted = await room.decrypt(pendingMessage(content as IMessage['content']));

		expect(decrypted).toMatchObject({ msg: messages.plaintext.msg, e2e: 'done' });
	});
});

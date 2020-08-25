import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import SimpleCrypto from 'react-native-simple-crypto';

import {
	toString,
	b64ToBuffer,
	bufferToUtf8,
	bufferToB64,
	utf8ToBuffer,
	splitVectorData,
	joinVectorData
} from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from './constants';
import RocketChat from '../rocketchat';
import { isIOS } from '../../utils/deviceInfo';
import Deferred from '../../utils/deferred';

export default class EncryptionRoom {
	constructor(subscription) {
		this.ready = false;
		this.establishing = false;
		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			// Mark as ready
			this.ready = true;
			// Mark as established
			this.establishing = false;
		});
		this.subscription = subscription;
	}

	// Initialize the E2E room
	handshake = async(privateKey) => {
		// If it's already ready we don't need to handshake again
		if (this.ready) {
			return;
		}

		// If it's already establishing
		if (this.establishing) {
			// Return the ready promise to wait this client ready
			return this.readyPromise;
		}

		// We're establishing a new room encryption client
		this.establishing = true;

		const { rid, E2EKey, e2eKeyId } = this.subscription;

		// If this room has a E2EKey let's import this
		if (E2EKey) {
			await this.importRoomKey(E2EKey, privateKey);
			this.readyPromise.resolve();
			return;
		}

		// If doesn't have a e2eKeyId we need to create keys to this room
		if (!e2eKeyId) {
			await this.createRoomKey();
			this.readyPromise.resolve();
			return;
		}

		// Request a E2EKey for this room to other users
		await RocketChat.methodCall('stream-notify-room-users', `${ rid }/e2ekeyRequest`, rid, e2eKeyId);
	}

	// Import roomKey as an AES Decrypt key
	importRoomKey = async(E2EKey, privateKey) => {
		try {
			const roomE2EKey = E2EKey.slice(12);

			if (!roomE2EKey) {
				return;
			}

			const decryptedKey = await SimpleCrypto.RSA.decrypt(roomE2EKey, privateKey);
			this.sessionKeyExportedString = toString(decryptedKey);

			this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

			const { k } = EJSON.parse(this.sessionKeyExportedString);
			this.roomKey = b64ToBuffer(k);
		} catch {
			// Do nothing
		}
	}

	// Create a key to a room
	createRoomKey = async() => {
		try {
			const key = await SimpleCrypto.utils.randomBytes(16);
			this.roomKey = key;

			let k = bufferToB64(this.roomKey);
			k = k.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
			const sessionKeyExported = {
				alg: 'A128CBC',
				ext: true,
				k,
				key_ops: ['encrypt', 'decrypt'],
				kty: 'oct'
			};

			this.sessionKeyExportedString = EJSON.stringify(sessionKeyExported);
			this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

			const { rid } = this.subscription;
			await RocketChat.e2eSetRoomKeyID(rid, this.keyID);

			await this.encryptRoomKey();
		} catch {
			// Do nothing
		}
	}

	// Create a encrypted key to this room base on users
	encryptRoomKey = async() => {
		const { rid } = this.subscription;
		const result = await RocketChat.e2eGetUsersOfRoomWithoutKey(rid);
		if (result.success) {
			const { users } = result;
			await Promise.all(users.map(user => this.encryptRoomKeyForUser(user, rid)));
		}
	}

	// Encrypt the room key to each user in
	encryptRoomKeyForUser = async(user, roomId) => {
		if (user?.e2e?.public_key) {
			const { public_key: publicKey } = user.e2e;
			try {
				const userKey = await SimpleCrypto.RSA.importKey(EJSON.parse(publicKey));
				let encryptedUserKey = await SimpleCrypto.RSA.encrypt(this.sessionKeyExportedString, userKey);
				// these replaces are a trick that I need to see if I can do better
				if (isIOS) {
					// replace all doesn't work on Android
					encryptedUserKey = encryptedUserKey.replaceAll('\n', '').replaceAll('\r', '');
				} else {
					// This is not doing the same thing between iOS and Android
					encryptedUserKey = encryptedUserKey.replace(/\n/g, '').replace(/\r/g, '');
				}
				await RocketChat.e2eUpdateGroupKey(user._id, roomId, this.keyID + encryptedUserKey);
			} catch {
				// Do nothing
			}
		}
	}

	// Provide this room key to a user
	provideKeyToUser = async(keyId) => {
		if (this.keyID !== keyId) {
			return;
		}

		try {
			await this.encryptRoomKey();
		} catch {
			// Do nothing
		}
	}

	// Encrypt messages
	encrypt = async(message) => {
		if (!this.ready) {
			return message;
		}

		if (!this.subscription?.encrypted) {
			return message;
		}

		try {
			const text = utf8ToBuffer(EJSON.stringify({
				_id: message._id,
				text: message.msg,
				userId: this.userId,
				ts: new Date()
			}));
			const vector = await SimpleCrypto.utils.randomBytes(16);
			const data = await SimpleCrypto.AES.encrypt(
				text,
				this.roomKey,
				vector
			);
			return {
				...message,
				t: E2E_MESSAGE_TYPE,
				e2e: E2E_STATUS.PENDING,
				msg: this.keyID + bufferToB64(joinVectorData(vector, data))
			};
		} catch {
			// Do nothing
		}

		return message;
	}

	// Decrypt messages
	decrypt = async(message) => {
		if (!this.ready) {
			return message;
		}

		try {
			const { t, e2e } = message;

			if (t === E2E_MESSAGE_TYPE && e2e !== E2E_STATUS.DONE) {
				let { msg } = message;
				msg = b64ToBuffer(msg.slice(12));
				const [vector, cipherText] = splitVectorData(msg);

				const decrypted = await SimpleCrypto.AES.decrypt(
					cipherText,
					this.roomKey,
					vector
				);

				const m = EJSON.parse(bufferToUtf8(decrypted));
				return {
					...message,
					msg: m.text,
					e2e: E2E_STATUS.DONE
				};
			}
		} catch {
			// Do nothing
		}

		return message;
	}
}

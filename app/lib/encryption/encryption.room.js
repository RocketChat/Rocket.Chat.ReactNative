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
	joinVectorData,
	jwkToPkcs1
} from './utils';
import database from '../database';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from './constants';
import RocketChat from '../rocketchat';
import { isIOS } from '../../utils/deviceInfo';

export default class EncryptionRoom {
	constructor(roomId) {
		this.roomId = roomId;
		this.ready = false;
	}

	// Initialize the E2E room
	handshake = async(privateKey) => {
		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		// TODO: Should be an observable to check encrypted property
		this.subscription = await subCollection.find(this.roomId);

		const { E2EKey, e2eKeyId, encrypted } = this.subscription;

		if (!encrypted) {
			return;
		}

		if (!privateKey) {
			return Promise.reject();
		}

		if (E2EKey) {
			await this.importRoomKey(E2EKey, privateKey);
			return;
		}

		if (!e2eKeyId) {
			await this.createRoomKey();
		}

		// notify-room-users
		// Notifications.notifyUsersOfRoom(this.roomId, 'e2ekeyRequest', this.roomId, e2eKeyId);
	}

	// Import roomKey as an AES Decrypt key
	importRoomKey = async(E2EKey, privateKey) => {
		const roomE2EKey = E2EKey.slice(12);

		if (!roomE2EKey) {
			return;
		}

		const decryptedKey = await SimpleCrypto.RSA.decrypt(roomE2EKey, privateKey);
		this.sessionKeyExportedString = toString(decryptedKey);

		this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

		const { k } = EJSON.parse(this.sessionKeyExportedString);
		this.roomKey = b64ToBuffer(k);
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

			await RocketChat.e2eSetRoomKeyID(this.roomId, this.keyID);

			await this.encryptRoomKey();
		} catch {
			// Do nothing
		}
	}

	// Create a encrypted key to this room base on users
	encryptRoomKey = async() => {
		const result = await RocketChat.e2eGetUsersOfRoomWithoutKey(this.roomId);
		if (result.success) {
			const { users } = result;
			await Promise.all(users.map(user => this.encryptRoomKeyForUser(user)));
		}
	}

	// Encrypt the room key to each user in
	encryptRoomKeyForUser = async(user) => {
		if (user?.e2e?.public_key) {
			const { public_key: publicKey } = user.e2e;
			try {
				const userKey = await jwkToPkcs1(EJSON.parse(publicKey));
				let encryptedUserKey = await SimpleCrypto.RSA.encrypt(this.sessionKeyExportedString, userKey);
				// these replaces are a trick that I need to see if I can do better
				if (isIOS) {
					// replace all doesn't work on Android
					encryptedUserKey = encryptedUserKey.replaceAll('\n', '').replaceAll('\r', '');
				} else {
					// This is not doing the same thing between iOS and Android
					encryptedUserKey = encryptedUserKey.replace(/\n/g, '').replace(/\r/g, '');
				}
				await RocketChat.e2eUpdateGroupKey(user._id, this.roomId, this.keyID + encryptedUserKey);
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
		if (!this.subscription.encrypted) {
			return message;
		}

		if (!this.roomKey) {
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
		if (!this.roomKey) {
			return message;
		}

		try {
			const { t } = message;

			if (t === E2E_MESSAGE_TYPE) {
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

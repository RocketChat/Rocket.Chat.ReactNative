import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import SimpleCrypto from 'react-native-simple-crypto';

import {
	toString,
	b64ToBuffer,
	bufferToUtf8,
	bufferToB64,
	bufferToB64URI,
	utf8ToBuffer,
	splitVectorData,
	joinVectorData
} from './utils';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from './constants';
import RocketChat from '../rocketchat';
import Deferred from '../../utils/deferred';
import debounce from '../../utils/debounce';

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
	handshake = async(privateKey, E2EKey = this.subscription.E2EKey) => {
		// If it's already ready we don't need to handshake again
		if (this.ready) {
			return;
		}

		// If it's already establishing
		if (this.establishing) {
			// Return the ready promise to wait this client ready
			return this.readyPromise;
		}

		// E2EKey = subscription property that user uses to decrypt messages
		// e2eKeyId = room property that flag if someone has a E2EKey of this room and the identifier of this
		const { e2eKeyId } = this.subscription;

		// If this room has a E2EKey, we import it
		if (E2EKey) {
			// We're establishing a new room encryption client
			this.establishing = true;
			await this.importRoomKey(E2EKey, privateKey);
			this.readyPromise.resolve();
			return;
		}

		// If it doesn't have a e2eKeyId, we need to create keys to the room
		if (!e2eKeyId) {
			// We're establishing a new room encryption client
			this.establishing = true;
			await this.createRoomKey();
			this.readyPromise.resolve();
			return;
		}

		// Request a E2EKey for this room to other users
		await this.requestRoomKey();
	}

	// Import roomKey as an AES Decrypt key
	importRoomKey = async(E2EKey, privateKey) => {
		try {
			const roomE2EKey = E2EKey.slice(12);

			const decryptedKey = await SimpleCrypto.RSA.decrypt(roomE2EKey, privateKey);
			this.sessionKeyExportedString = toString(decryptedKey);

			this.keyID = Base64.encode(this.sessionKeyExportedString).slice(0, 12);

			// Extract K from Web Crypto Secret Key
			// K is a base64URL encoded array of bytes
			// Web Crypto API uses this as a private key to decrypt/encrypt things
			// Reference: https://www.javadoc.io/doc/com.nimbusds/nimbus-jose-jwt/5.1/com/nimbusds/jose/jwk/OctetSequenceKey.html
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

			// Web Crypto format of a Secret Key
			const sessionKeyExported = {
				// Type of Secret Key
				kty: 'oct',
				// Algorithm
				alg: 'A128CBC',
				// Base64URI encoded array of bytes
				k: bufferToB64URI(this.roomKey),
				// Specific Web Crypto properties
				ext: true,
				key_ops: ['encrypt', 'decrypt']
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

	// Request a key to this room
	// We're debouncing this function to avoid multiple calls
	// when you join a room with a lot of messages and nobody
	// can send the encryption key at the moment.
	// Each time you see a encrypted message of a room that you don't have a key
	// this will be called again and run once in 5 seconds
	requestRoomKey = debounce(async() => {
		const { rid, e2eKeyId } = this.subscription;
		try {
			await RocketChat.e2eRequestRoomKey(rid, e2eKeyId);
		} catch {
			// Do nothing
		}
	}, 5000, true)

	// Create an encrypted key for this room based on users
	encryptRoomKey = async() => {
		const { rid } = this.subscription;
		const result = await RocketChat.e2eGetUsersOfRoomWithoutKey(rid);
		if (result.success) {
			const { users } = result;
			await Promise.all(users.map(user => this.encryptRoomKeyForUser(user, rid)));
		}
	}

	// Encrypt the room key to each user in
	encryptRoomKeyForUser = async(user, rid) => {
		if (user?.e2e?.public_key) {
			const { public_key: publicKey } = user.e2e;
			try {
				const userKey = await SimpleCrypto.RSA.importKey(EJSON.parse(publicKey));
				const encryptedUserKey = await SimpleCrypto.RSA.encrypt(this.sessionKeyExportedString, userKey);
				await RocketChat.e2eUpdateGroupKey(user?._id, rid, this.keyID + encryptedUserKey);
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

			// If message type is e2e and it's encrypted still
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

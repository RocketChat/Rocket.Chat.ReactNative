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
import database from '../database';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from './constants';
import e2e from './e2e';

export default class E2ERoom {
	constructor(roomId) {
		this.roomId = roomId;
	}

	// Initialize the E2E room
	handshake = async() => {
		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		// TODO: Should be an observable to check encrypted property
		this.subscription = await subCollection.find(this.roomId);

		await this.importRoomKey(this.subscription.E2EKey);
	}

	// Import roomKey as an AES Decrypt key
	importRoomKey = async(E2EKey) => {
		const roomE2EKey = E2EKey.slice(12);
		const decryptedKey = await SimpleCrypto.RSA.decrypt(roomE2EKey, e2e.privateKey);
		const sessionKey = toString(decryptedKey);

		this.keyID = Base64.encode(sessionKey).slice(0, 12);

		const { k } = EJSON.parse(sessionKey);
		this.roomKey = b64ToBuffer(k);
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

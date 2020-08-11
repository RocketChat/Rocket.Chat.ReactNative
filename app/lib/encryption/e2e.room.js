import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import SimpleCrypto from 'react-native-simple-crypto';

import {
	toString,
	b64ToBuffer,
	bufferToUtf8,
	splitVectorData
} from './utils';
import database from '../database';
import e2e from './e2e';

export default class E2ERoom {
	constructor(roomId) {
		this.roomId = roomId;
	}

	// Initialize the E2E room
	handshake = async() => {
		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		const subscription = await subCollection.find(this.roomId);

		await this.importRoomKey(subscription.E2EKey);
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

	// Decrypt messages
	decrypt = async(message) => {
		try {
			const { t } = message;

			if (t === 'e2e') {
				let { msg } = message;
				msg = b64ToBuffer(msg.slice(12));
				const [vector, cipherText] = splitVectorData(msg);

				const decrypted = await SimpleCrypto.AES.decrypt(
					cipherText,
					this.roomKey,
					vector
				);

				const m = EJSON.parse(bufferToUtf8(decrypted));
				return { ...message, msg: m.text, e2e: 'done' };
			}
		} catch {
			// Do nothing
		}

		return message;
	}
}

import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import SimpleCrypto from 'react-native-simple-crypto';
import ByteBuffer from 'bytebuffer';
import parse from 'url-parse';

import getSingleMessage from '../methods/getSingleMessage';
import { IMessage, IUser } from '../../definitions';
import Deferred from './helpers/deferred';
import { debounce } from '../methods/helpers';
import database from '../database';
import log from '../methods/helpers/log';
import {
	b64ToBuffer,
	bufferToB64,
	bufferToB64URI,
	bufferToUtf8,
	joinVectorData,
	splitVectorData,
	toString,
	utf8ToBuffer
} from './utils';
import { Encryption } from './index';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants';
import { Services } from '../services';
import { getMessageUrlRegex } from './helpers/getMessageUrlRegex';
import { mapMessageFromAPI } from './helpers/mapMessageFromApi';
import { mapMessageFromDB } from './helpers/mapMessageFromDB';
import { createQuoteAttachment } from './helpers/createQuoteAttachment';
import { getMessageById } from '../database/services/Message';

export default class EncryptionRoom {
	ready: boolean;
	roomId: string;
	userId: string;
	establishing: boolean;
	readyPromise: Deferred;
	sessionKeyExportedString: string | ByteBuffer;
	keyID: string;
	roomKey: ArrayBuffer;

	constructor(roomId: string, userId: string) {
		this.ready = false;
		this.roomId = roomId;
		this.userId = userId;
		this.establishing = false;
		this.keyID = '';
		this.sessionKeyExportedString = '';
		this.roomKey = new ArrayBuffer(0);
		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			// Mark as ready
			this.ready = true;
			// Mark as established
			this.establishing = false;
		});
	}

	// Initialize the E2E room
	handshake = async () => {
		// If it's already ready we don't need to handshake again
		if (this.ready) {
			return;
		}

		// If it's already establishing
		if (this.establishing) {
			// Return the ready promise to wait this client ready
			return this.readyPromise;
		}

		const db = database.active;
		const subCollection = db.get('subscriptions');
		try {
			// Find the subscription
			const subscription = await subCollection.find(this.roomId);

			const { E2EKey, e2eKeyId } = subscription;

			// If this room has a E2EKey, we import it
			if (E2EKey && Encryption.privateKey) {
				// We're establishing a new room encryption client
				this.establishing = true;
				const { keyID, roomKey, sessionKeyExportedString } = await this.importRoomKey(E2EKey, Encryption.privateKey);
				this.keyID = keyID;
				this.roomKey = roomKey;
				this.sessionKeyExportedString = sessionKeyExportedString;
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
			await this.requestRoomKey(e2eKeyId);
		} catch (e) {
			log(e);
		}
	};

	// Import roomKey as an AES Decrypt key
	importRoomKey = async (
		E2EKey: string,
		privateKey: string
	): Promise<{ sessionKeyExportedString: string | ByteBuffer; roomKey: ArrayBuffer; keyID: string }> => {
		try {
			const roomE2EKey = E2EKey.slice(12);

			const decryptedKey = await SimpleCrypto.RSA.decrypt(roomE2EKey, privateKey);
			const sessionKeyExportedString = toString(decryptedKey);

			const keyID = Base64.encode(sessionKeyExportedString as string).slice(0, 12);

			// Extract K from Web Crypto Secret Key
			// K is a base64URL encoded array of bytes
			// Web Crypto API uses this as a private key to decrypt/encrypt things
			// Reference: https://www.javadoc.io/doc/com.nimbusds/nimbus-jose-jwt/5.1/com/nimbusds/jose/jwk/OctetSequenceKey.html
			const { k } = EJSON.parse(sessionKeyExportedString as string);
			const roomKey = b64ToBuffer(k);

			return {
				sessionKeyExportedString,
				roomKey,
				keyID
			};
		} catch (e: any) {
			throw new Error(e);
		}
	};

	// Create a key to a room
	createRoomKey = async () => {
		const key = (await SimpleCrypto.utils.randomBytes(16)) as Uint8Array;
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

		await Services.e2eSetRoomKeyID(this.roomId, this.keyID);

		await this.encryptRoomKey();
	};

	// Request a key to this room
	// We're debouncing this function to avoid multiple calls
	// when you join a room with a lot of messages and nobody
	// can send the encryption key at the moment.
	// Each time you see a encrypted message of a room that you don't have a key
	// this will be called again and run once in 5 seconds
	requestRoomKey = debounce(
		async (e2eKeyId: string) => {
			await Services.e2eRequestRoomKey(this.roomId, e2eKeyId);
		},
		5000,
		true
	);

	// Create an encrypted key for this room based on users
	encryptRoomKey = async () => {
		const result = await Services.e2eGetUsersOfRoomWithoutKey(this.roomId);
		if (result.success) {
			const { users } = result;
			await Promise.all(users.map(user => this.encryptRoomKeyForUser(user)));
		}
	};

	// Encrypt the room key to each user in
	encryptRoomKeyForUser = async (user: Pick<IUser, '_id' | 'e2e'>) => {
		if (user?.e2e?.public_key) {
			const { public_key: publicKey } = user.e2e;
			const userKey = await SimpleCrypto.RSA.importKey(EJSON.parse(publicKey));
			const encryptedUserKey = await SimpleCrypto.RSA.encrypt(this.sessionKeyExportedString as string, userKey);
			await Services.e2eUpdateGroupKey(user?._id, this.roomId, this.keyID + encryptedUserKey);
		}
	};

	// Provide this room key to a user
	provideKeyToUser = async (keyId: string) => {
		// Don't provide a key if the keyId received
		// is different than the current one
		if (this.keyID !== keyId) {
			return;
		}

		await this.encryptRoomKey();
	};

	// Encrypt text
	encryptText = async (text: string | ArrayBuffer) => {
		text = utf8ToBuffer(text as string);
		const vector = await SimpleCrypto.utils.randomBytes(16);
		const data = await SimpleCrypto.AES.encrypt(text, this.roomKey as ArrayBuffer, vector);

		return this.keyID + bufferToB64(joinVectorData(vector, data));
	};

	// Encrypt messages
	encrypt = async (message: IMessage) => {
		if (!this.ready) {
			return message;
		}

		try {
			const msg = await this.encryptText(
				EJSON.stringify({
					_id: message._id,
					text: message.msg,
					userId: this.userId,
					ts: new Date()
				})
			);

			return {
				...message,
				t: E2E_MESSAGE_TYPE,
				e2e: E2E_STATUS.PENDING,
				msg
			};
		} catch {
			// Do nothing
		}

		return message;
	};

	// Decrypt text
	decryptText = async (msg: string | ArrayBuffer) => {
		msg = b64ToBuffer(msg.slice(12) as string);
		const [vector, cipherText] = splitVectorData(msg);

		const decrypted = await SimpleCrypto.AES.decrypt(cipherText, this.roomKey, vector);

		const m = EJSON.parse(bufferToUtf8(decrypted));

		return m.text;
	};

	// Decrypt messages
	decrypt = async (message: IMessage) => {
		if (!this.ready) {
			return message;
		}

		try {
			const { t, e2e } = message;

			// If message type is e2e and it's encrypted still
			if (t === E2E_MESSAGE_TYPE && e2e !== E2E_STATUS.DONE) {
				let { msg, tmsg } = message;
				// Decrypt msg
				msg = await this.decryptText(msg as string);

				// Decrypt tmsg
				if (tmsg) {
					tmsg = await this.decryptText(tmsg);
				}

				const decryptedMessage: IMessage = {
					...message,
					tmsg,
					msg,
					e2e: 'done'
				};

				const decryptedMessageWithQuote = await this.decryptQuoteAttachment(decryptedMessage);
				return decryptedMessageWithQuote;
			}
		} catch {
			// Do nothing
		}

		return message;
	};

	async decryptQuoteAttachment(message: IMessage) {
		const urls = message?.msg?.match(getMessageUrlRegex()) || [];
		await Promise.all(
			urls.map(async (url: string) => {
				const parsedUrl = parse(url, true);
				const messageId = parsedUrl.query?.msg;
				if (!messageId) {
					return;
				}

				// From local db
				const messageFromDB = await getMessageById(messageId);
				if (messageFromDB && messageFromDB.e2e === 'done') {
					const decryptedQuoteMessage = mapMessageFromDB(messageFromDB);
					message.attachments = message.attachments || [];
					const quoteAttachment = createQuoteAttachment(decryptedQuoteMessage, url);
					return message.attachments.push(quoteAttachment);
				}

				// From API
				const quotedMessageObject = await getSingleMessage(messageId);
				if (!quotedMessageObject) {
					return;
				}
				const decryptedQuoteMessage = await this.decrypt(mapMessageFromAPI(quotedMessageObject));
				message.attachments = message.attachments || [];
				const quoteAttachment = createQuoteAttachment(decryptedQuoteMessage, url);
				return message.attachments.push(quoteAttachment);
			})
		);
		return message;
	}
}

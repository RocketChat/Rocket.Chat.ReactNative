import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import SimpleCrypto from 'react-native-simple-crypto';
import ByteBuffer from 'bytebuffer';
import parse from 'url-parse';
import { sha256 } from 'js-sha256';

import getSingleMessage from '../methods/getSingleMessage';
import { IAttachment, IMessage, IUpload, TSendFileMessageFileInfo, IUser, IServerAttachment } from '../../definitions';
import Deferred from './helpers/deferred';
import { debounce } from '../methods/helpers';
import database from '../database';
import log from '../methods/helpers/log';
import {
	b64ToBuffer,
	bufferToB64,
	bufferToB64URI,
	bufferToUtf8,
	encryptAESCTR,
	exportAESCTR,
	generateAESCTRKey,
	getFileExtension,
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
import { TEncryptFileResult, TGetContent } from './definitions';

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
		try {
			const result = await Services.e2eGetUsersOfRoomWithoutKey(this.roomId);
			if (result.success) {
				const { users } = result;
				await Promise.all(users.map(user => this.encryptRoomKeyForUser(user)));
			}
		} catch (e) {
			log(e);
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
				msg,
				content: {
					algorithm: 'rc.v1.aes-sha2' as const,
					ciphertext: await this.encryptText(
						EJSON.stringify({
							msg: message.msg
						})
					)
				}
			};
		} catch {
			// Do nothing
		}

		return message;
	};

	// Encrypt upload
	encryptUpload = async (message: IUpload) => {
		if (!this.ready) {
			return message;
		}

		try {
			let description = '';

			if (message.description) {
				description = await this.encryptText(EJSON.stringify({ text: message.description }));
			}

			return {
				...message,
				t: E2E_MESSAGE_TYPE,
				e2e: E2E_STATUS.PENDING,
				description
			};
		} catch {
			// Do nothing
		}

		return message;
	};

	encryptFile = async (rid: string, file: TSendFileMessageFileInfo): TEncryptFileResult => {
		const { path } = file;
		const vector = await SimpleCrypto.utils.randomBytes(16);
		const key = await generateAESCTRKey();
		const exportedKey = await exportAESCTR(key);
		const iv = bufferToB64(vector);
		const checksum = await SimpleCrypto.utils.calculateFileChecksum(path);
		const encryptedFile = await encryptAESCTR(path, exportedKey.k, iv);

		const getContent: TGetContent = async (_id, fileUrl) => {
			const attachments: IAttachment[] = [];
			let att: IAttachment = {
				title: file.name,
				type: 'file',
				description: file.description,
				title_link: fileUrl,
				title_link_download: true,
				encryption: {
					key: exportedKey,
					iv: bufferToB64(vector)
				},
				hashes: {
					sha256: checksum
				}
			};
			if (file.type && /^image\/.+/.test(file.type)) {
				att = {
					...att,
					image_url: fileUrl,
					image_type: file.type,
					image_size: file.size,
					...(file.width &&
						file.height && {
							image_dimensions: {
								width: file.width,
								height: file.height
							}
						})
				};
			} else if (file.type && /^audio\/.+/.test(file.type)) {
				att = {
					...att,
					audio_url: fileUrl,
					audio_type: file.type,
					audio_size: file.size
				};
			} else if (file.type && /^video\/.+/.test(file.type)) {
				att = {
					...att,
					video_url: fileUrl,
					video_type: file.type,
					video_size: file.size
				};
			} else {
				att = {
					...att,
					size: file.size,
					format: getFileExtension(file.path)
				};
			}
			attachments.push(att);

			const files = [
				{
					_id,
					name: file.name,
					type: file.type,
					size: file.size
				}
			];

			const data = EJSON.stringify({
				attachments,
				files,
				file: files[0]
			});

			return {
				algorithm: 'rc.v1.aes-sha2',
				ciphertext: await Encryption.encryptText(rid, data)
			};
		};

		const fileContentData = {
			type: file.type,
			typeGroup: file.type?.split('/')[0],
			name: file.name,
			encryption: {
				key: exportedKey,
				iv
			},
			hashes: {
				sha256: checksum
			}
		};

		const fileContent = {
			algorithm: 'rc.v1.aes-sha2' as const,
			ciphertext: await Encryption.encryptText(rid, EJSON.stringify(fileContentData))
		};

		return {
			file: {
				...file,
				type: 'file',
				name: sha256(file.name ?? 'File message'),
				path: encryptedFile
			},
			getContent,
			fileContent
		};
	};

	// Decrypt text
	decryptText = async (msg: string | ArrayBuffer) => {
		if (!msg) {
			return null;
		}

		msg = b64ToBuffer(msg.slice(12) as string);
		const [vector, cipherText] = splitVectorData(msg);

		const decrypted = await SimpleCrypto.AES.decrypt(cipherText, this.roomKey, vector);

		const m = EJSON.parse(bufferToUtf8(decrypted));

		return m.text;
	};

	decryptFileContent = async (data: IServerAttachment) => {
		if (data.content?.algorithm === 'rc.v1.aes-sha2') {
			const content = await this.decryptContent(data.content.ciphertext);
			Object.assign(data, content);
		}
		return data;
	};

	decryptContent = async (contentBase64: string) => {
		if (!contentBase64) {
			return null;
		}

		const contentBuffer = b64ToBuffer(contentBase64.slice(12) as string);
		const [vector, cipherText] = splitVectorData(contentBuffer);
		const decrypted = await SimpleCrypto.AES.decrypt(cipherText, this.roomKey, vector);
		return EJSON.parse(bufferToUtf8(decrypted));
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
				const { msg, tmsg } = message;
				// Decrypt msg
				if (msg) {
					message.msg = await this.decryptText(msg);
				}

				// Decrypt tmsg
				if (tmsg) {
					message.tmsg = await this.decryptText(tmsg);
				}

				if (message.content?.algorithm === 'rc.v1.aes-sha2') {
					const content = await this.decryptContent(message.content.ciphertext);
					message = {
						...message,
						...content,
						attachments: content.attachments?.map((att: IAttachment) => ({
							...att,
							e2e: 'pending'
						}))
					};
				}

				const decryptedMessage: IMessage = {
					...message,
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

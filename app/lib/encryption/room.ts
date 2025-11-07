import EJSON from 'ejson';
import { Base64 } from 'js-base64';
import parse from 'url-parse';
import { sha256 } from 'js-sha256';
import {
	rsaDecrypt,
	randomBytes,
	rsaImportKey,
	rsaEncrypt,
	aesEncrypt,
	calculateFileChecksum,
	aesDecrypt,
	aesGcmEncrypt,
	aesGcmDecrypt,
	randomUuid
} from '@rocket.chat/mobile-crypto';

import getSingleMessage from '../methods/getSingleMessage';
import type {
	IAttachment,
	IMessage,
	IUpload,
	TSendFileMessageFileInfo,
	IServerAttachment,
	TSubscriptionModel,
	ISubscription
} from '../../definitions';
import Deferred from './helpers/deferred';
import { compareServerVersion, debounce } from '../methods/helpers';
import log from '../methods/helpers/log';
import {
	b64ToBuffer,
	bufferToB64,
	bufferToB64URI,
	bufferToUtf8,
	getE2EEMentions,
	encryptAESCTR,
	exportAESCTR,
	generateAESCTRKey,
	getFileExtension,
	joinVectorData,
	splitVectorData,
	toString,
	utf8ToBuffer,
	bufferToHex,
	decodePrefixedBase64,
	encodePrefixedBase64
} from './utils';
import { Encryption } from './index';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../constants/keys';
import {
	e2eRejectSuggestedGroupKey,
	e2eAcceptSuggestedGroupKey,
	e2eSetRoomKeyID,
	e2eRequestRoomKey,
	e2eGetUsersOfRoomWithoutKey,
	provideUsersSuggestedGroupKeys,
	e2eUpdateGroupKey
} from '../services/restApi';
import { getMessageUrlRegex } from './helpers/getMessageUrlRegex';
import { mapMessageFromAPI } from './helpers/mapMessageFromApi';
import { mapMessageFromDB } from './helpers/mapMessageFromDB';
import { createQuoteAttachment } from './helpers/createQuoteAttachment';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getMessageById } from '../database/services/Message';
import { type TEncryptFileResult, type TGetContent } from './definitions';
import { store } from '../store/auxStore';

type TAlgorithm = 'A128CBC' | 'A256GCM' | '';

export default class EncryptionRoom {
	ready: boolean;
	roomId: string;
	userId: string;
	establishing: boolean;
	readyPromise: Deferred;
	sessionKeyExportedString: string;
	keyID: string;
	algorithm: TAlgorithm;
	roomKey: ArrayBuffer;
	subscription: TSubscriptionModel | null;

	constructor(roomId: string, userId: string) {
		this.ready = false;
		this.roomId = roomId;
		this.userId = userId;
		this.establishing = false;
		this.keyID = '';
		this.algorithm = '';
		this.sessionKeyExportedString = '';
		this.roomKey = new ArrayBuffer(0);
		this.readyPromise = new Deferred();
		this.readyPromise.then(() => {
			// Mark as ready
			this.ready = true;
			// Mark as established
			this.establishing = false;
		});
		this.subscription = null;
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

		if (!this.subscription) {
			this.subscription = await getSubscriptionByRoomId(this.roomId);
			if (!this.subscription) {
				return;
			}
		}

		// Redundant check to avoid multiple handshakes, because of the async sub fetch
		if (this.establishing) {
			return this.readyPromise;
		}

		// Check if we have the user's private key to decrypt room keys
		if (!Encryption.privateKey) {
			// User hasn't entered E2E password yet
			// Room will remain not ready until password is entered
			return;
		}

		const { E2EKey, e2eKeyId, E2ESuggestedKey } = this.subscription;
		if (E2ESuggestedKey) {
			try {
				this.establishing = true;
				const { keyID, roomKey, sessionKeyExportedString, algorithm } = await this.importRoomKey(
					E2ESuggestedKey,
					Encryption.privateKey
				);
				this.keyID = keyID;
				this.roomKey = roomKey;
				this.sessionKeyExportedString = sessionKeyExportedString;
				this.algorithm = algorithm;
				try {
					await e2eAcceptSuggestedGroupKey(this.roomId);
					Encryption.deleteRoomInstance(this.roomId);
					return;
				} catch (error) {
					await e2eRejectSuggestedGroupKey(this.roomId);
				}
			} catch (e) {
				log(e);
			}
		}

		// If this room has a E2EKey, we import it
		if (E2EKey) {
			try {
				this.establishing = true;
				const { keyID, roomKey, sessionKeyExportedString, algorithm } = await this.importRoomKey(E2EKey, Encryption.privateKey);
				this.keyID = keyID;
				this.roomKey = roomKey;
				this.sessionKeyExportedString = sessionKeyExportedString;
				this.algorithm = algorithm;
				this.readyPromise.resolve();
				return;
			} catch (error) {
				this.establishing = false;
				log(error);
				// Fall through to try other options
			}
		}

		// If it doesn't have a e2eKeyId, we need to create keys to the room
		if (!e2eKeyId) {
			try {
				this.establishing = true;
				await this.createRoomKey();
				Encryption.deleteRoomInstance(this.roomId);
				return;
			} catch (error) {
				this.establishing = false;
				log(error);
				// Cannot create room key, room will remain not ready
			}
		}

		// Request a E2EKey for this room to other users
		// Room will remain not ready until the key is received via subscription update
		// When E2EKey arrives, next handshake() call will succeed
		this.requestRoomKey(e2eKeyId);
	};

	// Import roomKey as an AES Decrypt key
	importRoomKey = async (
		E2EKey: string,
		privateKey: string
	): Promise<{ sessionKeyExportedString: string; roomKey: ArrayBuffer; keyID: string; algorithm: TAlgorithm }> => {
		try {
			// Parse the encrypted key using prefixed base64
			const [kid, encryptedData] = decodePrefixedBase64(E2EKey);

			// Decrypt the session key
			const decryptedKey = await rsaDecrypt(bufferToB64(encryptedData), privateKey);
			const sessionKeyExportedString = toString(decryptedKey);

			const keyID = kid;
			const parsedKey = EJSON.parse(sessionKeyExportedString);
			const roomKey: ArrayBuffer = b64ToBuffer(parsedKey.k);

			return {
				sessionKeyExportedString,
				roomKey,
				keyID,
				algorithm: parsedKey.alg
			};
		} catch (e: any) {
			throw new Error(e);
		}
	};

	hasSessionKey = () => !!this.sessionKeyExportedString;

	createNewRoomKey = async () => {
		const { version } = store.getState().server;
		// v2
		if (compareServerVersion(version, 'greaterThanOrEqualTo', '7.13.0')) {
			this.roomKey = b64ToBuffer(await randomBytes(32));
			// Web Crypto format of a Secret Key
			const sessionKeyExported = {
				// Type of Secret Key
				kty: 'oct',
				// Algorithm
				alg: 'A256GCM',
				// Base64URI encoded array of bytes
				k: bufferToB64URI(this.roomKey),
				// Specific Web Crypto properties
				ext: true,
				key_ops: ['encrypt', 'decrypt']
			};
			this.keyID = await randomUuid();
			this.sessionKeyExportedString = EJSON.stringify(sessionKeyExported);
			this.algorithm = 'A256GCM';
			return;
		}

		// v1
		this.roomKey = b64ToBuffer(await randomBytes(16));
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
		this.algorithm = 'A128CBC';

		if (compareServerVersion(version, 'greaterThanOrEqualTo', '7.0.0')) {
			this.keyID = (await sha256(this.sessionKeyExportedString as string)).slice(0, 12);
		} else {
			this.keyID = Base64.encode(this.sessionKeyExportedString as string).slice(0, 12);
		}
	};

	createRoomKey = async () => {
		await this.createNewRoomKey();
		await e2eSetRoomKeyID(this.roomId, this.keyID);
		await this.encryptKeyForOtherParticipants();
	};

	async resetRoomKey() {
		if (!Encryption.publicKey) {
			console.log('Public key not found');
			return;
		}
		try {
			await this.createNewRoomKey();
			const e2eNewKeys = { e2eKeyId: this.keyID, e2eKey: await this.encryptRoomKeyForUser(Encryption.publicKey) };
			return e2eNewKeys;
		} catch (error) {
			console.error('Error resetting group key: ', error);
			throw error;
		}
	}

	// Request a key to this room
	// We're debouncing this function to avoid multiple calls
	// when you join a room with a lot of messages and nobody
	// can send the encryption key at the moment.
	// Each time you see a encrypted message of a room that you don't have a key
	// this will be called again and run once in 5 seconds
	requestRoomKey = debounce(
		async (e2eKeyId: string) => {
			try {
				await e2eRequestRoomKey(this.roomId, e2eKeyId);
			} catch {
				// do nothing
			}
		},
		5000,
		true
	);

	// Create an encrypted key for this room based on users
	encryptKeyForOtherParticipants = async () => {
		try {
			const decryptedOldGroupKeys = await this.exportOldRoomKeys(this.subscription?.oldRoomKeys);
			const result = await e2eGetUsersOfRoomWithoutKey(this.roomId);
			if (result.success) {
				const { users } = result;
				if (!users.length) {
					return;
				}
				const { version } = store.getState().server;
				if (compareServerVersion(version, 'greaterThanOrEqualTo', '7.0.0')) {
					const usersSuggestedGroupKeys = { [this.roomId]: [] as any[] };
					for await (const user of users) {
						const key = await this.encryptRoomKeyForUser(user.e2e!.public_key);
						const oldKeys = await this.encryptOldKeysForParticipant(user.e2e?.public_key, decryptedOldGroupKeys);

						usersSuggestedGroupKeys[this.roomId].push({ _id: user._id, key, ...(oldKeys && { oldKeys }) });
					}
					await provideUsersSuggestedGroupKeys(usersSuggestedGroupKeys);
				} else {
					await Promise.all(
						users.map(async user => {
							if (user.e2e?.public_key) {
								const key = await this.encryptRoomKeyForUser(user.e2e.public_key);
								if (key) {
									await e2eUpdateGroupKey(user?._id, this.roomId, key);
								}
							}
						})
					);
				}
			}
		} catch (e) {
			log(e);
		}
	};

	// Encrypt the room key to each user in
	encryptRoomKeyForUser = async (publicKey: string) => {
		try {
			const userKey = await rsaImportKey(EJSON.parse(publicKey));
			const encryptedUserKey = await rsaEncrypt(this.sessionKeyExportedString as string, userKey);
			const encryptedBuffer = b64ToBuffer(encryptedUserKey as string);
			return encodePrefixedBase64(this.keyID, encryptedBuffer);
		} catch (e) {
			log(e);
		}
	};

	// Provide this room key to a user
	provideKeyToUser = async (keyId: string) => {
		// Don't provide a key if the keyId received
		// is different than the current one
		if (this.keyID !== keyId) {
			return;
		}

		await this.encryptKeyForOtherParticipants();
	};

	async encryptOldKeysForParticipant(publicKey: any, oldRoomKeys: any) {
		if (!oldRoomKeys || oldRoomKeys.length === 0) {
			return;
		}

		let userKey;

		try {
			userKey = await rsaImportKey(EJSON.parse(publicKey));
		} catch (e) {
			log(e);
			return;
		}

		try {
			const keys = [];
			for await (const oldRoomKey of oldRoomKeys) {
				if (!oldRoomKey.E2EKey) {
					continue;
				}
				const encryptedKey = await rsaEncrypt(oldRoomKey.E2EKey, userKey);
				const encryptedUserKey = oldRoomKey.e2eKeyId + encryptedKey;
				keys.push({ ...oldRoomKey, E2EKey: encryptedUserKey });
			}
			return keys;
		} catch (e) {
			log(e);
		}
	}

	async exportOldRoomKeys(oldKeys: any) {
		if (!oldKeys || oldKeys.length === 0) {
			return [];
		}

		const keys = [];
		for await (const key of oldKeys) {
			try {
				if (!key.E2EKey || !Encryption.privateKey) {
					continue;
				}

				const { sessionKeyExportedString } = await this.importRoomKey(key.E2EKey, Encryption.privateKey);
				keys.push({
					...key,
					E2EKey: sessionKeyExportedString
				});
			} catch (e) {
				log(e);
			}
		}

		return keys;
	}

	async encryptGroupKeyForParticipantsWaitingForTheKeys(users: any[]) {
		if (!this.ready) {
			return;
		}

		const decryptedOldGroupKeys = await this.exportOldRoomKeys(this.subscription?.oldRoomKeys);
		const usersWithKeys = await Promise.all(
			users.map(async user => {
				const { _id, public_key } = user;
				const key = await this.encryptRoomKeyForUser(public_key);
				const oldKeys = await this.encryptOldKeysForParticipant(public_key, decryptedOldGroupKeys);
				return { _id, key, ...(oldKeys && { oldKeys }) };
			})
		);

		return usersWithKeys;
	}

	// Encrypt text - returns structured object with algorithm
	encryptText = async (
		text: string
	): Promise<
		| { algorithm: 'rc.v2.aes-sha2'; kid: string; iv: string; ciphertext: string }
		| { algorithm: 'rc.v1.aes-sha2'; ciphertext: string }
	> => {
		const textBuffer = utf8ToBuffer(text);
		if (this.algorithm === 'A256GCM') {
			const vectorBase64 = await randomBytes(12);
			const vector = b64ToBuffer(vectorBase64);
			const data = await aesGcmEncrypt(bufferToB64(textBuffer), bufferToHex(this.roomKey), bufferToHex(vector));
			return {
				algorithm: 'rc.v2.aes-sha2' as const,
				kid: this.keyID,
				iv: vectorBase64,
				ciphertext: data
			};
		}

		const vectorBase64 = await randomBytes(16);
		const vector = b64ToBuffer(vectorBase64);
		const data = b64ToBuffer(await aesEncrypt(bufferToB64(textBuffer), bufferToHex(this.roomKey), bufferToHex(vector)));
		return {
			algorithm: 'rc.v1.aes-sha2' as const,
			ciphertext: this.keyID + bufferToB64(joinVectorData(vector, data))
		};
	};

	// Encrypt messages
	encrypt = async (message: IMessage): Promise<IMessage> => {
		if (!this.ready) {
			return message;
		}

		try {
			const content = await this.encryptText(EJSON.stringify({ msg: message.msg || '' }));

			return {
				...message,
				t: E2E_MESSAGE_TYPE,
				e2e: E2E_STATUS.PENDING,
				e2eMentions: getE2EEMentions(message.msg),
				content
			};
		} catch (e) {
			// Do nothing
			console.error(e);
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
				const encryptedResult = await this.encryptText(EJSON.stringify({ msg: message.description }));
				description =
					encryptedResult.algorithm === 'rc.v1.aes-sha2'
						? encryptedResult.ciphertext
						: EJSON.stringify({ kid: encryptedResult.kid, iv: encryptedResult.iv, ciphertext: encryptedResult.ciphertext });
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
		const vectorBuffer = b64ToBuffer(await randomBytes(16));
		const keyBuffer = b64ToBuffer(await generateAESCTRKey());
		const exportedKey = await exportAESCTR(keyBuffer);
		const ivBase64 = bufferToB64(vectorBuffer);
		const checksum = await calculateFileChecksum(path);
		const encryptedFile = await encryptAESCTR(path, exportedKey.k, ivBase64);

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
					iv: ivBase64
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

			const encryptedResult = await this.encryptText(data);
			return encryptedResult;
		};

		const fileContentData = {
			type: file.type,
			typeGroup: file.type?.split('/')[0],
			name: file.name,
			encryption: {
				key: exportedKey,
				iv: ivBase64
			},
			hashes: {
				sha256: checksum
			}
		};

		const fileContent = await this.encryptText(EJSON.stringify(fileContentData));

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

	decryptFileContent = async (data: IServerAttachment) => {
		if (data.content?.algorithm === 'rc.v1.aes-sha2' || data.content?.algorithm === 'rc.v2.aes-sha2') {
			const content = await this.decryptContent(data.content);
			Object.assign(data, content);
		}
		return data;
	};

	parse = (
		payload: string | IMessage['content']
	): {
		kid: string;
		iv: ArrayBuffer;
		ciphertext: string;
	} => {
		// v2: {"kid":"...", "iv": "...", "ciphertext":"..."}
		if (typeof payload !== 'string' && payload?.algorithm === 'rc.v2.aes-sha2') {
			return { kid: payload.kid, iv: b64ToBuffer(payload.iv), ciphertext: payload.ciphertext };
		}
		// v1: kid + base64(vector + ciphertext)
		const message = typeof payload === 'string' ? payload : payload?.ciphertext || '';
		const kid = message.slice(0, 12);
		const contentBuffer = b64ToBuffer(message.slice(12) as string);
		const [iv, ciphertext] = splitVectorData(contentBuffer);
		return { kid, iv, ciphertext: bufferToB64(ciphertext) };
	};

	doDecrypt = async (ciphertext: string, key: ArrayBuffer, iv: ArrayBuffer, algorithm: TAlgorithm) => {
		const keyHex = bufferToHex(key);
		const ivHex = bufferToHex(iv);
		let decrypted;
		if (algorithm === 'A256GCM') {
			decrypted = await aesGcmDecrypt(ciphertext, keyHex, ivHex);
		} else {
			decrypted = await aesDecrypt(ciphertext, keyHex, ivHex);
		}
		if (!decrypted) {
			return null;
		}
		return EJSON.parse(bufferToUtf8(b64ToBuffer(decrypted)));
	};

	decryptContent = async (content: IMessage['content'] | string) => {
		try {
			if (!content) {
				return null;
			}

			const { kid, iv, ciphertext } = this.parse(content);

			if (kid !== this.keyID) {
				const oldRoomKey = this.subscription?.oldRoomKeys?.find((key: any) => key.e2eKeyId === kid);
				if (oldRoomKey?.E2EKey && Encryption.privateKey) {
					const { roomKey, algorithm } = await this.importRoomKey(oldRoomKey.E2EKey, Encryption.privateKey);
					return this.doDecrypt(ciphertext, roomKey, iv, algorithm);
				}
				return null;
			}

			return this.doDecrypt(ciphertext, this.roomKey, iv, this.algorithm);
		} catch (error) {
			console.error(error);
			return null;
		}
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
				const content = await this.decryptContent(message.content || message.msg);
				message = {
					...message,
					...content,
					attachments: content.attachments?.map((att: IAttachment) => ({
						...att,
						e2e: 'pending'
					}))
				};
				if (content.text) {
					message.msg = content.text;
				}

				const decryptedMessage = {
					...message,
					e2e: 'done'
				};

				const decryptedMessageWithQuote = await this.decryptQuoteAttachment(decryptedMessage as IMessage);
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
				const quoteAttachment = createQuoteAttachment(decryptedQuoteMessage as IMessage, url);
				return message.attachments.push(quoteAttachment);
			})
		);
		return message;
	}

	decryptSubscription = async (subscription: Partial<ISubscription>) => {
		if (!this.ready) {
			return subscription;
		}

		// If the subscription doesn't have a lastMessage just return
		const { rid, lastMessage } = subscription;
		if (!lastMessage) {
			return subscription;
		}

		const { t, e2e } = lastMessage;

		// If it's not an encrypted message
		if (t !== E2E_MESSAGE_TYPE) {
			return subscription;
		}

		// If already marked as decrypted in the incoming data
		if (e2e === E2E_STATUS.DONE) {
			return subscription;
		}

		if (!rid) {
			return subscription;
		}

		if (
			this.subscription?.lastMessage?._updatedAt &&
			lastMessage?._updatedAt &&
			new Date(this.subscription.lastMessage._updatedAt).getTime() === new Date(lastMessage._updatedAt).getTime() &&
			this.subscription?.lastMessage?.e2e === E2E_STATUS.DONE
		) {
			// Same message already decrypted in DB, return subscription with DB's decrypted version
			return {
				...subscription,
				lastMessage: this.subscription?.lastMessage
			};
		}

		const decryptedMessage = await this.decrypt(lastMessage as IMessage);
		return {
			...subscription,
			lastMessage: decryptedMessage
		};
	};
}

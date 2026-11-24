import { Q } from '@nozbe/watermelondb';
import EJSON from 'ejson';
import {
	aesCbcDecrypt,
	aesCbcEncrypt,
	aesDecryptFile,
	aesDeriveKey,
	aesGcmDecrypt,
	aesGcmEncrypt,
	rsaGenerateKeys,
	rsaImportPrivateKey,
	type AESKey,
	type RSAPrivateKey
} from '@rocket.chat/mobile-crypto';
import sampleSize from 'lodash/sampleSize';

import { type IMessage, type TMessageModel } from '~/definitions/IMessage';
import { type IServerAttachment } from '~/definitions/IAttachment';
import { type ISubscription, type TSubscriptionModel } from '~/definitions/ISubscription';
import { type TSendFileMessageFileInfo } from '~/definitions/IUpload';
import { type TThreadMessageModel } from '~/definitions/IThreadMessage';
import { type TThreadModel } from '~/definitions/IThread';
import {
	E2E_BANNER_TYPE,
	E2E_MESSAGE_TYPE,
	E2E_PRIVATE_KEY,
	E2E_PUBLIC_KEY,
	E2E_RANDOM_PASSWORD_KEY,
	E2E_STATUS
} from '../constants/keys';
import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from '../methods/helpers/log';
import protectedFunction from '../methods/helpers/protectedFunction';
import UserPreferences from '../methods/userPreferences';
import { compareServerVersion } from '../methods/helpers/compareServerVersion';
import {
	e2eSetUserPublicAndPrivateKeys,
	e2eRequestSubscriptionKeys,
	fetchUsersWaitingForGroupKey,
	provideUsersSuggestedGroupKeys
} from '../services/restApi';
import { store } from '../store/auxStore';
import { KEY_DISTRIBUTION_INTERVAL, MAX_CONCURRENT_QUEUE } from './constants';
import type { IDecryptionFileQueue, TDecryptFile } from './definitions';
import Deferred from './helpers/deferred';
import EncryptionRoom from './room';
import { utf8ToBuffer, bufferToB64, parsePrivateKey, generatePassphrase } from './utils';

const ROOM_KEY_EXCHANGE_SIZE = 10;

class Encryption {
	ready: boolean;
	privateKey: RSAPrivateKey | null;
	publicKey: string | null;
	readyPromise: Deferred;
	userId: string | null;
	roomInstances: Record<string, EncryptionRoom>;
	decryptionFileQueue: IDecryptionFileQueue[];
	decryptionFileQueueActiveCount: number;
	keyDistributionInterval: ReturnType<typeof setInterval> | null;

	constructor() {
		this.userId = '';
		this.ready = false;
		this.privateKey = null;
		this.publicKey = null;
		this.roomInstances = {};
		this.readyPromise = new Deferred();
		this.readyPromise
			.then(() => {
				this.ready = true;
			})
			.catch(() => {
				this.ready = false;
			});
		this.decryptionFileQueue = [];
		this.decryptionFileQueueActiveCount = 0;
		this.keyDistributionInterval = null;
	}

	// Initialize Encryption client
	initialize = (userId: string) => {
		this.userId = userId;
		this.roomInstances = {};

		// Don't await these promises
		// so they can run parallelized
		this.decryptPendingSubscriptions();
		this.decryptPendingMessages();
		this.initiateKeyDistribution();

		// Mark Encryption client as ready
		this.readyPromise.resolve();
	};

	get establishing() {
		const { banner, enabled } = store.getState().encryption;
		// If the password was not inserted yet
		if (!enabled || banner === E2E_BANNER_TYPE.REQUEST_PASSWORD) {
			// We can't decrypt/encrypt, so, reject this try
			return Promise.reject();
		}

		// Wait the client ready state
		return this.readyPromise;
	}

	// Stop Encryption client
	stop = () => {
		this.userId = null;
		this.privateKey = null;
		this.publicKey = null;
		this.roomInstances = {};
		if (this.keyDistributionInterval) {
			clearInterval(this.keyDistributionInterval);
		}
		this.keyDistributionInterval = null;
		// Cancel ongoing encryption/decryption requests
		this.readyPromise.reject();
		// Reset Deferred
		this.ready = false;
		this.readyPromise = new Deferred();
		this.readyPromise
			.then(() => {
				this.ready = true;
			})
			.catch(() => {
				this.ready = false;
			});
	};

	stopRoom = (rid: string) => {
		delete this.roomInstances[rid];
	};

	// When a new participant join and request a new room encryption key
	provideRoomKeyToUser = async (keyId: string, rid: string) => {
		// If the client is not ready
		if (!this.ready) {
			try {
				// Wait for ready status
				await this.establishing;
			} catch {
				// If it can't be initialized (missing password)
				// return and don't provide a key
				return;
			}
		}

		const roomE2E = await this.getRoomInstance(rid);
		if (!roomE2E || !roomE2E?.hasSessionKey()) {
			return;
		}
		return roomE2E.provideKeyToUser(keyId);
	};

	// Persist keys on UserPreferences
	persistKeys = async (server: string, publicKey: string, privateKey: string) => {
		this.privateKey = await rsaImportPrivateKey(privateKey);
		this.publicKey = publicKey;
		UserPreferences.setString(`${server}-${E2E_PUBLIC_KEY}`, publicKey);
		UserPreferences.setString(`${server}-${E2E_PRIVATE_KEY}`, privateKey);
	};

	// Could not obtain public-private keypair from server.
	createKeys = async (userId: string, server: string) => {
		// Generate new keys
		const { publicKey, privateKey } = await rsaGenerateKeys(2048);

		// Cast these keys to the properly server format
		const publicJwk = publicKey.exportJwk();
		const privateJwk = privateKey.exportJwk();

		// Persist these new keys
		await this.persistKeys(server, publicJwk, privateJwk);

		// Create a password to encode the private key
		const password = await this.createRandomPassword(server);

		// Encode the private key
		const encodedPrivateKey = await this.encodePrivateKey(privateJwk, password, userId);

		// Send the new keys to the server
		await e2eSetUserPublicAndPrivateKeys(publicJwk, encodedPrivateKey);

		// Request e2e keys of all encrypted rooms
		await e2eRequestSubscriptionKeys();
	};

	// Encode a private key before send it to the server
	encodePrivateKey = async (privateKey: string, password: string, userId: string) => {
		// TODO: get the appropriate server version
		const { version } = store.getState().server;
		const isV2 = compareServerVersion(version, 'greaterThanOrEqualTo', '7.13.0');

		const salt = isV2 ? `v2:${userId}:mobile` : userId;
		const masterKey = await this.generateMasterKey(password, salt, isV2 ? 100000 : 1000);

		if (isV2) {
			const { iv, ciphertext } = await aesGcmEncrypt(masterKey, privateKey);
			return EJSON.stringify({ iv, ciphertext, salt, iterations: 100000 });
		}

		return JSON.stringify({ $binary: await aesCbcEncrypt(masterKey, privateKey) });
	};

	// Decode a private key fetched from server
	decodePrivateKey = async (privateKey: string, password: string, userId: string) => {
		const parsedKey = parsePrivateKey(privateKey, userId);
		const masterKey = await this.generateMasterKey(password, parsedKey.salt, parsedKey.iterations);

		if (parsedKey.version === 'v2') {
			return aesGcmDecrypt(masterKey, { iv: parsedKey.iv, ciphertext: parsedKey.ciphertext });
		}
		return aesCbcDecrypt(masterKey, parsedKey.ivAndCiphertext);
	};

	// Generate a user master key, this is based on salt and a password
	generateMasterKey = (password: string, salt: string, iterations: number): Promise<AESKey> =>
		aesDeriveKey(bufferToB64(utf8ToBuffer(password)), bufferToB64(utf8ToBuffer(salt)), {
			iterations,
			byteLength: 32,
			hash: 'SHA256'
		});

	// Create a random password to local created keys
	createRandomPassword = async (server: string) => {
		const password = await generatePassphrase();
		UserPreferences.setString(`${server}-${E2E_RANDOM_PASSWORD_KEY}`, password);
		return password;
	};

	changePassword = async (server: string, password: string) => {
		// Cast key to the format server is expecting
		const privateKey = (this.privateKey as RSAPrivateKey).exportJwk();

		// Encode the private key
		const encodedPrivateKey = await this.encodePrivateKey(privateKey, password, this.userId as string);

		// This public key is already encoded using EJSON.stringify in the `persistKeys` method
		const publicKey = UserPreferences.getString(`${server}-${E2E_PUBLIC_KEY}`);

		if (!publicKey) {
			throw new Error('Public key not found in local storage, password not changed');
		}

		// Only send force param for newer worspace versions
		const { version } = store.getState().server;
		let force = false;
		if (compareServerVersion(version, 'greaterThanOrEqualTo', '6.10.0')) {
			force = true;
		}

		// Send the new keys to the server
		await e2eSetUserPublicAndPrivateKeys(publicKey, encodedPrivateKey, force);
	};

	// get a encryption room instance
	getRoomInstance = async (rid: string) => {
		try {
			// Prevent handshake again
			const existingRoomE2E = this.roomInstances[rid];
			if (existingRoomE2E) {
				await existingRoomE2E.handshake();
				return existingRoomE2E;
			}
			this.roomInstances[rid] = new EncryptionRoom(rid, this.userId as string, this);

			const roomE2E = this.roomInstances[rid];

			// Start Encryption Room instance handshake
			await roomE2E.handshake();

			return roomE2E;
		} catch (e) {
			log(e);
			return null;
		}
	};

	deleteRoomInstance = (rid: string) => {
		delete this.roomInstances[rid];
	};

	// Logic to decrypt all pending messages/threads/threadMessages
	// after initialize the encryption client
	decryptPendingMessages = async (roomId?: string) => {
		const db = database.active;

		const messagesCollection = db.get('messages');
		const threadsCollection = db.get('threads');
		const threadMessagesCollection = db.get('thread_messages');

		// e2e status is null or 'pending' and message type is 'e2e'
		const whereClause = [Q.where('t', E2E_MESSAGE_TYPE), Q.or(Q.where('e2e', null), Q.where('e2e', E2E_STATUS.PENDING))];

		// decrypt messages of a room
		if (roomId) {
			whereClause.push(Q.where('rid', roomId));
		}

		try {
			// Find all messages/threads/threadsMessages that have pending e2e status
			const messagesToDecrypt = await messagesCollection.query(...whereClause).fetch();
			const threadsToDecrypt = await threadsCollection.query(...whereClause).fetch();
			const threadMessagesToDecrypt = await threadMessagesCollection.query(...whereClause).fetch();

			// Concat messages/threads/threadMessages
			const toDecrypt: (TThreadModel | TThreadMessageModel | TMessageModel)[] = [
				...messagesToDecrypt,
				...threadsToDecrypt,
				...threadMessagesToDecrypt
			];

			const decrypted = await Promise.all(
				toDecrypt.map(async message => {
					const { t, msg, tmsg, attachments, content } = message;
					let newMessage: Partial<TMessageModel> = {};
					const rid = message.subscription?.id;
					if (rid) {
						// WM Object -> Plain Object
						newMessage = await this.decryptMessage({
							t,
							rid,
							msg: msg as string,
							tmsg,
							attachments,
							content
						} as IMessage);
					}

					return { message, newMessage };
				})
			);

			if (!decrypted.length) {
				return;
			}

			await db.write(async () => {
				const prepared = decrypted.map(({ message, newMessage }) => {
					try {
						return message.prepareUpdate(
							protectedFunction((m: TMessageModel) => {
								Object.assign(m, newMessage);
							})
						);
					} catch (e) {
						log(e);
						return null;
					}
				});
				await db.batch(prepared.filter(record => record !== null));
			});
		} catch (e) {
			log(e);
		}
	};

	// Logic to decrypt all pending subscriptions
	// after initialize the encryption client
	decryptPendingSubscriptions = async () => {
		const db = database.active;
		const subCollection = db.get('subscriptions');
		try {
			// Find all rooms that can have a lastMessage encrypted
			// If we select only encrypted rooms we can miss some room that changed their encrypted status
			const subsEncrypted = await subCollection.query(Q.where('e2e_key_id', Q.notEq(null)), Q.where('encrypted', true)).fetch();

			/**
			 * Filter out subscriptions that already have their lastMessage decrypted.
			 * We fetch updated subscriptions from server and decrypt them later.
			 */
			const subsEncryptedToDecrypt = subsEncrypted.filter(
				sub => sub.lastMessage?.t === E2E_MESSAGE_TYPE && sub.lastMessage?.e2e !== E2E_STATUS.DONE
			);

			const decrypted = await Promise.all(
				subsEncryptedToDecrypt.map(async (sub: TSubscriptionModel) => {
					try {
						return { sub, newSub: await this.decryptSubscription(sub) };
					} catch (e) {
						log(e);
						return { sub, newSub: null };
					}
				})
			);

			if (!decrypted.length) {
				return;
			}

			await db.write(async () => {
				const prepared = decrypted.map(({ sub, newSub }) => {
					try {
						return sub.prepareUpdate(
							protectedFunction((m: TSubscriptionModel) => {
								if (newSub?.lastMessage) {
									m.lastMessage = newSub.lastMessage;
								}
							})
						);
					} catch (e) {
						log(e);
						return null;
					}
				});
				await db.batch(prepared.filter(record => record !== null));
			});
		} catch (e) {
			log(e);
		}
	};

	async getSuggestedE2EEKeys(usersWaitingForE2EKeys: Record<string, { _id: string; public_key: string }[]>) {
		const roomIds = Object.keys(usersWaitingForE2EKeys);
		return Object.fromEntries(
			// @ts-ignore
			(
				await Promise.all(
					roomIds.map(async room => {
						const roomE2E = await this.getRoomInstance(room);
						if (!roomE2E || !roomE2E?.hasSessionKey()) {
							return;
						}
						const usersWithKeys = await roomE2E.encryptGroupKeyForParticipantsWaitingForTheKeys(usersWaitingForE2EKeys[room]);

						if (!usersWithKeys) {
							return;
						}

						return [room, usersWithKeys];
					})
				)
			).filter(Boolean)
		);
	}

	async getSample(roomIds: string[], limit = 3): Promise<string[]> {
		if (limit === 0) {
			return [];
		}

		const randomRoomIds = sampleSize(roomIds, ROOM_KEY_EXCHANGE_SIZE);

		const sampleIds: string[] = [];
		for await (const roomId of randomRoomIds) {
			const roomE2E = await this.getRoomInstance(roomId);
			if (!roomE2E || !roomE2E?.hasSessionKey()) {
				continue;
			}

			sampleIds.push(roomId);
		}

		if (!sampleIds.length && roomIds.length > limit) {
			return this.getSample(roomIds, limit - 1);
		}

		return sampleIds;
	}

	initiateKeyDistribution = async () => {
		if (this.keyDistributionInterval) {
			return;
		}

		let distributing = false;
		const keyDistribution = async () => {
			if (distributing) {
				return;
			}
			distributing = true;
			const db = database.active;
			const subCollection = db.get('subscriptions');
			try {
				const subscriptions = await subCollection.query(Q.where('users_waiting_for_e2e_keys', Q.notEq(null)));
				if (subscriptions) {
					const filteredSubs = subscriptions
						.filter(sub => sub.usersWaitingForE2EKeys && !sub.usersWaitingForE2EKeys.some(user => user.userId === this.userId))
						.map(sub => sub.rid);

					const sampleIds = await this.getSample(filteredSubs);

					if (!sampleIds.length) {
						return;
					}

					const result = await fetchUsersWaitingForGroupKey(sampleIds);
					if (!result.success || !Object.keys(result.usersWaitingForE2EKeys).length) {
						return;
					}

					const userKeysWithRooms = await this.getSuggestedE2EEKeys(result.usersWaitingForE2EKeys);

					if (!Object.keys(userKeysWithRooms).length) {
						return;
					}

					await provideUsersSuggestedGroupKeys(userKeysWithRooms);
				}
			} catch (e) {
				log(e);
			} finally {
				distributing = false;
			}
		};

		this.keyDistributionInterval = setInterval(keyDistribution, KEY_DISTRIBUTION_INTERVAL);
		await keyDistribution();
	};

	// Creating the instance is enough to generate room e2ee key
	encryptSubscription = (rid: string) => this.getRoomInstance(rid as string);

	// Decrypt a subscription lastMessage
	decryptSubscription = async (subscription: Partial<ISubscription>) => {
		const { rid } = subscription;
		const roomE2E = await this.getRoomInstance(rid as string);
		return roomE2E?.decryptSubscription(subscription);
	};

	// Encrypt a message
	encryptMessage = async (message: IMessage) => {
		const { rid } = message;
		const db = database.active;
		const subCollection = db.get('subscriptions');

		// If workspace-level E2E is disabled, send the message unencrypted regardless of
		// any stale `encrypted: true` flag on the local subscription record.
		const e2eeEnabled = store.getState().settings.E2E_Enable;
		if (!e2eeEnabled) {
			return message;
		}

		try {
			// Find the subscription
			const subRecord = await subCollection.find(rid);

			// Subscription is not encrypted at the moment
			if (!subRecord.encrypted) {
				// Send a non encrypted message
				return message;
			}

			const roomE2E = await this.getRoomInstance(rid);
			if (!roomE2E || !roomE2E?.hasSessionKey()) {
				return;
			}
			return roomE2E.encrypt(message);
		} catch {
			// Subscription not found
			// or client can't be initialized (missing password)
		}

		// Send a non encrypted message
		return message;
	};

	// Decrypt a message
	decryptMessage = async (message: IMessage) => {
		const { t, e2e } = message;

		// Prevent create a new instance if this room was encrypted sometime ago
		if (t !== E2E_MESSAGE_TYPE || e2e === E2E_STATUS.DONE) {
			return message;
		}

		const { rid } = message;
		const roomE2E = await this.getRoomInstance(rid);
		if (!roomE2E || !roomE2E?.hasSessionKey()) {
			return message;
		}
		return roomE2E.decrypt(message);
	};

	decryptFileContent = async (file: IServerAttachment) => {
		const roomE2E = await this.getRoomInstance(file.rid);
		if (!roomE2E || !roomE2E?.hasSessionKey()) {
			return file;
		}

		return roomE2E.decryptFileContent(file);
	};

	encryptFile = async (rid: string, file: TSendFileMessageFileInfo) => {
		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			throw new Error('Subscription not found');
		}

		const { E2E_Enable, E2E_Enable_Encrypt_Files } = store.getState().settings;
		if (
			E2E_Enable === false ||
			!subscription.encrypted ||
			(E2E_Enable_Encrypt_Files !== undefined && !E2E_Enable_Encrypt_Files)
		) {
			// Send a non encrypted message
			return { file };
		}

		const roomE2E = await this.getRoomInstance(rid);
		if (!roomE2E?.hasSessionKey()) {
			throw new Error('Room encryption key is not available');
		}
		return roomE2E.encryptFile(rid, file);
	};

	canSendToRoom = async (rid: string): Promise<boolean> => {
		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			return false;
		}
		if (!subscription.encrypted || store.getState().settings.E2E_Enable === false) {
			return true;
		}
		try {
			await this.establishing;
		} catch {
			return false;
		}
		const roomE2E = await this.getRoomInstance(rid);
		return !!roomE2E?.hasSessionKey();
	};

	decryptFile: TDecryptFile = (_messageId, path, encryption, originalChecksum) =>
		aesDecryptFile({ path, key: encryption.key.k, iv: encryption.iv, sha256: originalChecksum });

	addFileToDecryptFileQueue: TDecryptFile = (messageId, path, encryption, originalChecksum) =>
		new Promise((resolve, reject) => {
			this.decryptionFileQueue.push({
				params: [messageId, path, encryption, originalChecksum],
				resolve,
				reject
			});
			this.processFileQueue();
		});

	async processFileQueue() {
		if (this.decryptionFileQueueActiveCount >= MAX_CONCURRENT_QUEUE || this.decryptionFileQueue.length === 0) {
			return;
		}
		const queueItem = this.decryptionFileQueue.shift();
		// FIXME: TS not getting decryptionFileQueue is not empty. TS 5.5 fix?
		if (!queueItem) {
			return;
		}
		const { params, resolve, reject } = queueItem;
		this.decryptionFileQueueActiveCount += 1;

		try {
			const result = await this.decryptFile(...params);
			resolve(result);
		} catch (error) {
			reject(error);
		} finally {
			this.decryptionFileQueueActiveCount -= 1;
			this.processFileQueue();
		}
	}

	// Decrypt multiple messages
	decryptMessages = (messages: Partial<IMessage>[]) =>
		Promise.all(messages.map((m: Partial<IMessage>) => this.decryptMessage(m as IMessage)));

	// Decrypt multiple subscriptions
	decryptSubscriptions = (subscriptions: ISubscription[]) => {
		if (!this.ready) {
			return subscriptions;
		}
		return Promise.all(subscriptions.map(s => this.decryptSubscription(s)));
	};

	// Decrypt multiple files
	decryptFiles = (files: IServerAttachment[]) => Promise.all(files.map(f => this.decryptFileContent(f)));
}

const encryption = new Encryption();
export default encryption;

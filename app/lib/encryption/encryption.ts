import { Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import EJSON from 'ejson';
import { deleteAsync } from 'expo-file-system';
import SimpleCrypto from 'react-native-simple-crypto';
import { sampleSize } from 'lodash';

import {
	IMessage,
	IServerAttachment,
	ISubscription,
	TMessageModel,
	TSendFileMessageFileInfo,
	TSubscriptionModel,
	TThreadMessageModel,
	TThreadModel
} from '../../definitions';
import {
	E2E_BANNER_TYPE,
	E2E_MESSAGE_TYPE,
	E2E_PRIVATE_KEY,
	E2E_PUBLIC_KEY,
	E2E_RANDOM_PASSWORD_KEY,
	E2E_STATUS
} from '../constants';
import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from '../methods/helpers/log';
import protectedFunction from '../methods/helpers/protectedFunction';
import UserPreferences from '../methods/userPreferences';
import { compareServerVersion } from '../methods/helpers';
import { Services } from '../services';
import { store } from '../store/auxStore';
import { MAX_CONCURRENT_QUEUE } from './constants';
import { IDecryptionFileQueue, TDecryptFile, TEncryptFile } from './definitions';
import Deferred from './helpers/deferred';
import EncryptionRoom from './room';
import { decryptAESCTR, joinVectorData, randomPassword, splitVectorData, toString, utf8ToBuffer } from './utils';

const ROOM_KEY_EXCHANGE_SIZE = 10;
class Encryption {
	ready: boolean;
	privateKey: string | null;
	publicKey: string | null;
	readyPromise: Deferred;
	userId: string | null;
	roomInstances: {
		[rid: string]: {
			ready: boolean;
			provideKeyToUser: Function;
			handshake: Function;
			decrypt: Function;
			decryptFileContent: Function;
			encrypt: Function;
			encryptText: Function;
			encryptFile: TEncryptFile;
			encryptUpload: Function;
			importRoomKey: Function;
			resetRoomKey: Function;
			hasSessionKey: () => boolean;
			encryptGroupKeyForParticipantsWaitingForTheKeys: (params: any) => Promise<any>;
		};
	};
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
		this.privateKey = await SimpleCrypto.RSA.importKey(EJSON.parse(privateKey));
		this.publicKey = EJSON.stringify(publicKey);
		UserPreferences.setString(`${server}-${E2E_PUBLIC_KEY}`, this.publicKey);
		UserPreferences.setString(`${server}-${E2E_PRIVATE_KEY}`, privateKey);
	};

	// Could not obtain public-private keypair from server.
	createKeys = async (userId: string, server: string) => {
		// Generate new keys
		const key = await SimpleCrypto.RSA.generateKeys(2048);

		// Cast these keys to the properly server format
		const publicKey = await SimpleCrypto.RSA.exportKey(key.public);
		const privateKey = await SimpleCrypto.RSA.exportKey(key.private);

		// Persist these new keys
		this.persistKeys(server, publicKey, EJSON.stringify(privateKey));

		// Create a password to encode the private key
		const password = await this.createRandomPassword(server);

		// Encode the private key
		const encodedPrivateKey = await this.encodePrivateKey(EJSON.stringify(privateKey), password, userId);

		// Send the new keys to the server
		await Services.e2eSetUserPublicAndPrivateKeys(EJSON.stringify(publicKey), encodedPrivateKey);

		// Request e2e keys of all encrypted rooms
		await Services.e2eRequestSubscriptionKeys();
	};

	// Encode a private key before send it to the server
	encodePrivateKey = async (privateKey: string, password: string, userId: string) => {
		const masterKey = await this.generateMasterKey(password, userId);

		const vector = await SimpleCrypto.utils.randomBytes(16);
		const data = await SimpleCrypto.AES.encrypt(utf8ToBuffer(privateKey), masterKey, vector);

		return EJSON.stringify(new Uint8Array(joinVectorData(vector, data)));
	};

	// Decode a private key fetched from server
	decodePrivateKey = async (privateKey: string, password: string, userId: string) => {
		const masterKey = await this.generateMasterKey(password, userId);
		const [vector, cipherText] = splitVectorData(EJSON.parse(privateKey));

		const privKey = await SimpleCrypto.AES.decrypt(cipherText, masterKey, vector);

		return toString(privKey);
	};

	// Generate a user master key, this is based on userId and a password
	generateMasterKey = async (password: string, userId: string) => {
		const iterations = 1000;
		const hash = 'SHA256';
		const keyLen = 32;

		const passwordBuffer = utf8ToBuffer(password);
		const saltBuffer = utf8ToBuffer(userId);

		const masterKey = await SimpleCrypto.PBKDF2.hash(passwordBuffer, saltBuffer, iterations, keyLen, hash);

		return masterKey;
	};

	// Create a random password to local created keys
	createRandomPassword = async (server: string) => {
		const password = await randomPassword();
		UserPreferences.setString(`${server}-${E2E_RANDOM_PASSWORD_KEY}`, password);
		return password;
	};

	changePassword = async (server: string, password: string) => {
		// Cast key to the format server is expecting
		const privateKey = await SimpleCrypto.RSA.exportKey(this.privateKey as string);

		// Encode the private key
		const encodedPrivateKey = await this.encodePrivateKey(EJSON.stringify(privateKey), password, this.userId as string);

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
		await Services.e2eSetUserPublicAndPrivateKeys(publicKey, encodedPrivateKey, force);
	};

	// get a encryption room instance
	getRoomInstance = async (rid: string) => {
		try {
			// Prevent handshake again
			if (this.roomInstances[rid]) {
				await this.roomInstances[rid].handshake();
				return this.roomInstances[rid];
			}
			this.roomInstances[rid] = new EncryptionRoom(rid, this.userId as string);

			const roomE2E = this.roomInstances[rid];

			// Start Encryption Room instance handshake
			await roomE2E.handshake();

			return roomE2E;
		} catch (e) {
			log(e);
			return null;
		}
	};

	evaluateSuggestedKey = async (rid: string, E2ESuggestedKey: string) => {
		if (this.privateKey) {
			try {
				const roomE2E = await this.getRoomInstance(rid);
				if (!roomE2E) {
					return;
				}

				try {
					await roomE2E.importRoomKey(E2ESuggestedKey, this.privateKey);
				} catch (error) {
					await Services.e2eRejectSuggestedGroupKey(rid);
					return;
				}
				await Services.e2eAcceptSuggestedGroupKey(rid);
			} catch (e) {
				console.error(e);
			}
		}
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
			let toDecrypt: (TThreadModel | TThreadMessageModel | TMessageModel)[] = [
				...messagesToDecrypt,
				...threadsToDecrypt,
				...threadMessagesToDecrypt
			];
			toDecrypt = (await Promise.all(
				toDecrypt.map(async message => {
					const { t, msg, tmsg, attachments, content } = message;
					let newMessage: TMessageModel = {} as TMessageModel;
					if (message.subscription) {
						const { id: rid } = message.subscription;
						// WM Object -> Plain Object
						newMessage = await this.decryptMessage({
							t,
							rid,
							msg: msg as string,
							tmsg,
							attachments,
							content
						});
					}

					try {
						return message.prepareUpdate(
							protectedFunction((m: TMessageModel) => {
								Object.assign(m, newMessage);
							})
						);
					} catch {
						return null;
					}
				})
			)) as (TThreadModel | TThreadMessageModel)[];

			await db.write(async () => {
				await db.batch(toDecrypt);
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
			await Promise.all(
				subsEncrypted.map(async (sub: TSubscriptionModel) => {
					const { rid, lastMessage } = sub;
					const newSub = await this.decryptSubscription({ rid, lastMessage });
					try {
						return sub.prepareUpdate(
							protectedFunction((m: TSubscriptionModel) => {
								Object.assign(m, newSub);
							})
						);
					} catch {
						return null;
					}
				})
			);

			await db.write(async () => {
				await db.batch(subsEncrypted);
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

		const keyDistribution = async () => {
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

					const result = await Services.fetchUsersWaitingForGroupKey(sampleIds);
					if (!result.success || !Object.keys(result.usersWaitingForE2EKeys).length) {
						return;
					}

					const userKeysWithRooms = await this.getSuggestedE2EEKeys(result.usersWaitingForE2EKeys);

					if (!Object.keys(userKeysWithRooms).length) {
						return;
					}

					await Services.provideUsersSuggestedGroupKeys(userKeysWithRooms);
				}
			} catch (e) {
				log(e);
			}
		};

		await keyDistribution();
		this.keyDistributionInterval = setInterval(keyDistribution, 10000);
	};

	// Creating the instance is enough to generate room e2ee key
	encryptSubscription = (rid: string) => this.getRoomInstance(rid as string);

	// Decrypt a subscription lastMessage
	decryptSubscription = async (subscription: Partial<ISubscription>) => {
		// If the subscription doesn't have a lastMessage just return
		if (!subscription?.lastMessage) {
			return subscription;
		}

		const { lastMessage } = subscription;
		const { t, e2e } = lastMessage;

		// If it's not a encrypted message or was decrypted before
		if (t !== E2E_MESSAGE_TYPE || e2e === E2E_STATUS.DONE) {
			return subscription;
		}

		// If the client is not ready
		if (!this.ready) {
			try {
				// Wait for ready status
				await this.establishing;
			} catch {
				// If it can't be initialized (missing password)
				// return the encrypted message
				return subscription;
			}
		}

		const { rid } = subscription;
		if (!rid) {
			return subscription;
		}
		const subRecord = await getSubscriptionByRoomId(rid);

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const batch: Model[] = [];
			// If the subscription doesn't exists yet
			if (!subRecord) {
				// Let's create the subscription with the data received
				batch.push(
					subCollection.prepareCreate((s: TSubscriptionModel) => {
						s._raw = sanitizedRaw({ id: rid }, subCollection.schema);
						Object.assign(s, subscription);
					})
				);
				// If the subscription already exists but doesn't have the E2EKey yet
			} else if (!subRecord.E2EKey && subscription.E2EKey) {
				try {
					// Let's update the subscription with the received E2EKey
					batch.push(
						subRecord.prepareUpdate((s: TSubscriptionModel) => {
							s.E2EKey = subscription.E2EKey;
						})
					);
				} catch (e) {
					log(e);
				}
			}

			// If batch has some operation
			if (batch.length) {
				await db.write(async () => {
					await db.batch(batch);
				});
			}
		} catch {
			// Abort the decryption process
			// Return as received
			return subscription;
		}

		// Get a instance using the subscription
		const roomE2E = await this.getRoomInstance(rid as string);
		if (!roomE2E) {
			return;
		}
		const decryptedMessage = await roomE2E.decrypt(lastMessage);
		return {
			...subscription,
			lastMessage: decryptedMessage
		};
	};

	encryptText = async (rid: string, text: string) => {
		const roomE2E = await this.getRoomInstance(rid);
		if (!roomE2E || !roomE2E?.hasSessionKey()) {
			return;
		}
		return roomE2E.encryptText(text);
	};

	// Encrypt a message
	encryptMessage = async (message: IMessage) => {
		const { rid } = message;
		const db = database.active;
		const subCollection = db.get('subscriptions');

		try {
			// Find the subscription
			const subRecord = await subCollection.find(rid);

			// Subscription is not encrypted at the moment
			if (!subRecord.encrypted) {
				// Send a non encrypted message
				return message;
			}

			// If the client is not ready
			if (!this.ready) {
				// Wait for ready status
				await this.establishing;
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
	decryptMessage = async (message: Pick<IMessage, 't' | 'e2e' | 'rid' | 'msg' | 'tmsg' | 'attachments' | 'content'>) => {
		const { t, e2e } = message;

		// Prevent create a new instance if this room was encrypted sometime ago
		if (t !== E2E_MESSAGE_TYPE || e2e === E2E_STATUS.DONE) {
			return message;
		}

		// If the client is not ready
		if (!this.ready) {
			try {
				// Wait for ready status
				await this.establishing;
			} catch {
				// If it can't be initialized (missing password)
				// return the encrypted message
				return message;
			}
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

		const { E2E_Enable_Encrypt_Files } = store.getState().settings;
		if (!subscription.encrypted || (E2E_Enable_Encrypt_Files !== undefined && !E2E_Enable_Encrypt_Files)) {
			// Send a non encrypted message
			return { file };
		}

		// If the client is not ready
		if (!this.ready) {
			// Wait for ready status
			await this.establishing;
		}

		const roomE2E = await this.getRoomInstance(rid);
		if (!roomE2E || !roomE2E?.hasSessionKey()) {
			return { file };
		}
		return roomE2E.encryptFile(rid, file);
	};

	decryptFile: TDecryptFile = async (messageId, path, encryption, originalChecksum) => {
		const decryptedFile = await decryptAESCTR(path, encryption.key.k, encryption.iv);
		if (decryptedFile) {
			const checksum = await SimpleCrypto.utils.calculateFileChecksum(decryptedFile);
			if (checksum !== originalChecksum) {
				await deleteAsync(decryptedFile);
				return null;
			}
		}
		return decryptedFile;
	};

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

import EJSON from 'ejson';
import SimpleCrypto from 'react-native-simple-crypto';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import {
	toString,
	utf8ToBuffer,
	splitVectorData,
	joinVectorData,
	randomPassword
} from './utils';
import {
	E2E_PUBLIC_KEY,
	E2E_PRIVATE_KEY,
	E2E_RANDOM_PASSWORD_KEY,
	E2E_STATUS,
	E2E_MESSAGE_TYPE,
	E2E_BANNER_TYPE
} from './constants';
import RocketChat from '../rocketchat';
import { EncryptionRoom } from './index';
import UserPreferences from '../userPreferences';
import database from '../database';
import protectedFunction from '../methods/helpers/protectedFunction';
import Deferred from '../../utils/deferred';
import log from '../../utils/log';
import store from '../createStore';

class Encryption {
	constructor() {
		this.ready = false;
		this.privateKey = null;
		this.roomInstances = {};
		this.readyPromise = new Deferred();
		this.readyPromise
			.then(() => {
				this.ready = true;
			})
			.catch(() => {
				this.ready = false;
			});
	}

	// Initialize Encryption client
	initialize = (userId) => {
		this.userId = userId;
		this.roomInstances = {};

		// Don't await these promises
		// so they can run parallelized
		this.decryptPendingSubscriptions();
		this.decryptPendingMessages();

		// Mark Encryption client as ready
		this.readyPromise.resolve();
	}

	get establishing() {
		const { banner } = store.getState().encryption;
		// If the password was not inserted yet
		if (!banner || banner === E2E_BANNER_TYPE.REQUEST_PASSWORD) {
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
	}

	// When a new participant join and request a new room encryption key
	provideRoomKeyToUser = async(keyId, rid) => {
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
		return roomE2E.provideKeyToUser(keyId);
	}

	// Persist keys on UserPreferences
	persistKeys = async(server, publicKey, privateKey) => {
		this.privateKey = await SimpleCrypto.RSA.importKey(EJSON.parse(privateKey));
		await UserPreferences.setStringAsync(`${ server }-${ E2E_PUBLIC_KEY }`, EJSON.stringify(publicKey));
		await UserPreferences.setStringAsync(`${ server }-${ E2E_PRIVATE_KEY }`, privateKey);
	}

	// Could not obtain public-private keypair from server.
	createKeys = async(userId, server) => {
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
		await RocketChat.e2eSetUserPublicAndPrivateKeys(EJSON.stringify(publicKey), encodedPrivateKey);

		// Request e2e keys of all encrypted rooms
		await RocketChat.e2eRequestSubscriptionKeys();
	}

	// Encode a private key before send it to the server
	encodePrivateKey = async(privateKey, password, userId) => {
		const masterKey = await this.generateMasterKey(password, userId);

		const vector = await SimpleCrypto.utils.randomBytes(16);
		const data = await SimpleCrypto.AES.encrypt(
			utf8ToBuffer(privateKey),
			masterKey,
			vector
		);

		return EJSON.stringify(new Uint8Array(joinVectorData(vector, data)));
	}

	// Decode a private key fetched from server
	decodePrivateKey = async(privateKey, password, userId) => {
		const masterKey = await this.generateMasterKey(password, userId);
		const [vector, cipherText] = splitVectorData(EJSON.parse(privateKey));

		const privKey = await SimpleCrypto.AES.decrypt(
			cipherText,
			masterKey,
			vector
		);

		return toString(privKey);
	}

	// Generate a user master key, this is based on userId and a password
	generateMasterKey = async(password, userId) => {
		const iterations = 1000;
		const hash = 'SHA256';
		const keyLen = 32;

		const passwordBuffer = utf8ToBuffer(password);
		const saltBuffer = utf8ToBuffer(userId);

		const masterKey = await SimpleCrypto.PBKDF2.hash(
			passwordBuffer,
			saltBuffer,
			iterations,
			keyLen,
			hash
		);

		return masterKey;
	}

	// Create a random password to local created keys
	createRandomPassword = async(server) => {
		const password = randomPassword();
		await UserPreferences.setStringAsync(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`, password);
		return password;
	}

	changePassword = async(server, password) => {
		// Cast key to the format server is expecting
		const privateKey = await SimpleCrypto.RSA.exportKey(this.privateKey);

		// Encode the private key
		const encodedPrivateKey = await this.encodePrivateKey(EJSON.stringify(privateKey), password, this.userId);
		const publicKey = await UserPreferences.getStringAsync(`${ server }-${ E2E_PUBLIC_KEY }`);

		// Send the new keys to the server
		await RocketChat.e2eSetUserPublicAndPrivateKeys(EJSON.stringify(publicKey), encodedPrivateKey);
	}

	// get a encryption room instance
	getRoomInstance = async(rid) => {
		// Prevent handshake again
		if (this.roomInstances[rid]?.ready) {
			return this.roomInstances[rid];
		}

		// If doesn't have a instance of this room
		if (!this.roomInstances[rid]) {
			this.roomInstances[rid] = new EncryptionRoom(rid, this.userId);
		}

		const roomE2E = this.roomInstances[rid];

		// Start Encryption Room instance handshake
		await roomE2E.handshake();

		return roomE2E;
	}

	// Logic to decrypt all pending messages/threads/threadMessages
	// after initialize the encryption client
	decryptPendingMessages = async(roomId) => {
		const db = database.active;

		const messagesCollection = db.get('messages');
		const threadsCollection = db.get('threads');
		const threadMessagesCollection = db.get('thread_messages');

		// e2e status is null or 'pending' and message type is 'e2e'
		const whereClause = [
			Q.where('t', E2E_MESSAGE_TYPE),
			Q.or(
				Q.where('e2e', null),
				Q.where('e2e', E2E_STATUS.PENDING)
			)
		];

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
			let toDecrypt = [...messagesToDecrypt, ...threadsToDecrypt, ...threadMessagesToDecrypt];
			toDecrypt = await Promise.all(toDecrypt.map(async(message) => {
				const { t, msg, tmsg } = message;
				const { id: rid } = message.subscription;
				// WM Object -> Plain Object
				const newMessage = await this.decryptMessage({
					t,
					rid,
					msg,
					tmsg
				});
				if (message._hasPendingUpdate) {
					console.log(message);
					return;
				}
				return message.prepareUpdate(protectedFunction((m) => {
					Object.assign(m, newMessage);
				}));
			}));

			await db.action(async() => {
				await db.batch(...toDecrypt);
			});
		} catch (e) {
			log(e);
		}
	}

	// Logic to decrypt all pending subscriptions
	// after initialize the encryption client
	decryptPendingSubscriptions = async() => {
		const db = database.active;
		const subCollection = db.get('subscriptions');
		try {
			// Find all rooms that can have a lastMessage encrypted
			// If we select only encrypted rooms we can miss some room that changed their encrypted status
			const subsEncrypted = await subCollection.query(Q.where('e2e_key_id', Q.notEq(null))).fetch();
			// We can't do this on database level since lastMessage is not a database object
			const subsToDecrypt = subsEncrypted.filter(sub => (
				// Encrypted message
				sub?.lastMessage?.t === E2E_MESSAGE_TYPE
				// Message pending decrypt
				&& sub?.lastMessage?.e2e === E2E_STATUS.PENDING
			));
			await Promise.all(subsToDecrypt.map(async(sub) => {
				const { rid, lastMessage } = sub;
				const newSub = await this.decryptSubscription({ rid, lastMessage });
				if (sub._hasPendingUpdate) {
					console.log(sub);
					return;
				}
				return sub.prepareUpdate(protectedFunction((m) => {
					Object.assign(m, newSub);
				}));
			}));

			await db.action(async() => {
				await db.batch(...subsToDecrypt);
			});
		} catch (e) {
			log(e);
		}
	}

	// Decrypt a subscription lastMessage
	decryptSubscription = async(subscription) => {
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
		const db = database.active;
		const subCollection = db.get('subscriptions');

		let subRecord;
		try {
			subRecord = await subCollection.find(rid);
		} catch {
			// Do nothing
		}

		try {
			const batch = [];
			// If the subscription doesn't exists yet
			if (!subRecord) {
				// Let's create the subscription with the data received
				batch.push(subCollection.prepareCreate((s) => {
					s._raw = sanitizedRaw({ id: rid }, subCollection.schema);
					Object.assign(s, subscription);
				}));
			// If the subscription already exists but doesn't have the E2EKey yet
			} else if (!subRecord.E2EKey && subscription.E2EKey) {
				if (!subRecord._hasPendingUpdate) {
					// Let's update the subscription with the received E2EKey
					batch.push(subRecord.prepareUpdate((s) => {
						s.E2EKey = subscription.E2EKey;
					}));
				}
			}

			// If batch has some operation
			if (batch.length) {
				await db.action(async() => {
					await db.batch(...batch);
				});
			}
		} catch {
			// Abort the decryption process
			// Return as received
			return subscription;
		}

		// Get a instance using the subscription
		const roomE2E = await this.getRoomInstance(rid);
		const decryptedMessage = await roomE2E.decrypt(lastMessage);
		return {
			...subscription,
			lastMessage: decryptedMessage
		};
	}

	// Encrypt a message
	encryptMessage = async(message) => {
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
			return roomE2E.encrypt(message);
		} catch {
			// Subscription not found
			// or client can't be initialized (missing password)
		}

		// Send a non encrypted message
		return message;
	}

	// Decrypt a message
	decryptMessage = async(message) => {
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
		return roomE2E.decrypt(message);
	}

	// Decrypt multiple messages
	decryptMessages = messages => Promise.all(messages.map(m => this.decryptMessage(m)))

	// Decrypt multiple subscriptions
	decryptSubscriptions = subscriptions => Promise.all(subscriptions.map(s => this.decryptSubscription(s)))
}

const encryption = new Encryption();
export default encryption;

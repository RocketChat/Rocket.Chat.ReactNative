import EJSON from 'ejson';
import SimpleCrypto from 'react-native-simple-crypto';
import prompt from 'react-native-prompt-android';
import RNUserDefaults from 'rn-user-defaults';
import { Q } from '@nozbe/watermelondb';

import {
	toString,
	utf8ToBuffer,
	splitVectorData,
	joinVectorData,
	randomPassword,
	jwkToPkcs1,
	pkcs1ToJwk
} from './utils';
import {
	E2E_PUBLIC_KEY,
	E2E_PRIVATE_KEY,
	E2E_RANDOM_PASSWORD_KEY,
	E2E_STATUS,
	E2E_MESSAGE_TYPE
} from './constants';
import RocketChat from '../rocketchat';
import E2ERoom from './encryption.room';
import database from '../database';
import I18n from '../../i18n';

class Encryption {
	constructor() {
		this.started = false;
		this.roomInstances = {};
	}

	start = async(server, userId) => {
		if (this.started) {
			return;
		}

		this.started = true;

		// TODO: Do this better
		this.server = server;
		this.userId = userId;

		try {
			const storedPublicKey = await RNUserDefaults.get(`${ this.server }-${ E2E_PUBLIC_KEY }`);
			const storedPrivateKey = await RNUserDefaults.get(`${ this.server }-${ E2E_PRIVATE_KEY }`);

			const { publicKey, privateKey } = await this.fetchMyKeys();

			const pubKey = EJSON.parse(storedPublicKey || publicKey || '{}');
			let privKey = storedPrivateKey;
			if (!storedPrivateKey && privateKey) {
				privKey = await this.decodePrivateKey(privateKey);
			}

			if (pubKey && privKey) {
				await this.loadKeys(pubKey, privKey);
			} else {
				await this.createKeys();
			}

			this.decryptPendingSubscriptions();
			this.decryptPendingMessages();
		} catch {
			// Do nothing
		}
	}

	stop = () => {
		this.started = false;
		this.roomInstances = {};
	}

	provideRoomKeyToUser = async(keyId, roomId) => {
		try {
			const roomE2E = await this.getRoomInstance(roomId);
			if (!roomE2E) {
				return;
			}
			roomE2E.provideKeyToUser(keyId);
		} catch {
			// Do nothing
		}
	}

	// Load stored or sought on server keys
	loadKeys = async(publicKey, privateKey) => {
		try {
			this.privateKey = await jwkToPkcs1(EJSON.parse(privateKey));
			await RNUserDefaults.set(`${ this.server }-${ E2E_PUBLIC_KEY }`, EJSON.stringify(publicKey));
			await RNUserDefaults.set(`${ this.server }-${ E2E_PRIVATE_KEY }`, privateKey);
		} catch {
			// Do nothing
		}
	}

	// Could not obtain public-private keypair from server.
	createKeys = async() => {
		try {
			const key = await SimpleCrypto.RSA.generateKeys(2048);
			const publicKey = await pkcs1ToJwk(key.public);
			const privateKey = await pkcs1ToJwk(key.private);

			this.loadKeys(publicKey, EJSON.stringify(privateKey));
			const password = await this.createRandomPassword();
			const encodedPrivateKey = await this.encodePrivateKey(EJSON.stringify(privateKey), password);
			await RocketChat.e2eSetUserPublicAndPrivateKeys(EJSON.stringify(publicKey), encodedPrivateKey);
			await RocketChat.e2eRequestSubscriptionKeys();
		} catch {
			// Do nothing
		}
	}

	fetchMyKeys = async() => {
		try {
			const result = await RocketChat.e2eFetchMyKeys();
			if (result.success) {
				const { public_key, private_key } = result;
				return {
					publicKey: public_key,
					privateKey: private_key
				};
			}
		} catch {
			// Do nothing
		}
		return {};
	}

	encodePrivateKey = async(privateKey, password) => {
		const masterKey = await this.getMasterKey(password);

		try {
			const vector = await SimpleCrypto.utils.randomBytes(16);
			const data = await SimpleCrypto.AES.encrypt(
				utf8ToBuffer(privateKey),
				masterKey,
				vector
			);

			return EJSON.stringify(new Uint8Array(joinVectorData(vector, data)));
		} catch {
			// Do nothing
		}
	}

	requestPassword = () => new Promise((resolve, reject) => prompt(
		I18n.t('Enter_your_E2E_password'),
		'',
		[
			{
				text: I18n.t('I_ll_do_it_later'),
				onPress: reject,
				style: 'cancel'
			},
			{
				text: I18n.t('Decode_Key'),
				onPress: pw => resolve(pw)
			}
		],
		{
			cancelable: true
		}
	))

	decodePrivateKey = async(privateKey) => {
		// TODO: Handle reject when user doesn't provide a password
		const password = await this.requestPassword();
		const masterKey = await this.getMasterKey(password);
		const [vector, cipherText] = splitVectorData(EJSON.parse(privateKey));

		const privKey = await SimpleCrypto.AES.decrypt(
			cipherText,
			masterKey,
			vector
		);

		return toString(privKey);
	}

	getMasterKey = async(password) => {
		const iterations = 1000;
		const hash = 'SHA256';
		const keyLen = 32;

		const passwordBuffer = utf8ToBuffer(password);
		const saltBuffer = utf8ToBuffer(this.userId);
		try {
			const masterKey = await SimpleCrypto.PBKDF2.hash(
				passwordBuffer,
				saltBuffer,
				iterations,
				keyLen,
				hash
			);

			return masterKey;
		} catch {
			// Do nothing
		}
	}

	createRandomPassword = async() => {
		const password = randomPassword();
		await RNUserDefaults.set(`${ this.server }-${ E2E_RANDOM_PASSWORD_KEY }`, password);
		return password;
	}

	getRoomInstance = async(rid) => {
		if (this.roomInstances[rid]) {
			return this.roomInstances[rid];
		}

		const roomE2E = new E2ERoom(rid);
		await roomE2E.handshake(this.privateKey);
		this.roomInstances[rid] = roomE2E;
		return roomE2E;
	}

	decryptPendingMessages = async() => {
		const db = database.active;
		// TODO: We should do the same to thread messages
		const messagesCollection = db.collections.get('messages');
		try {
			const messagesToDecrypt = await messagesCollection.query(Q.where('e2e', E2E_STATUS.PENDING), Q.where('t', E2E_MESSAGE_TYPE)).fetch();
			messagesToDecrypt.forEach(async(message) => {
				try {
					// We should do this to don't try to update the database object
					const { rid, t, msg } = message;
					const decryptedMessage = await this.decryptMessage({ rid, t, msg });
					db.action(() => message.update((m) => {
						Object.assign(m, decryptedMessage);
					}));
				} catch {
					// Do nothing
				}
			});
		} catch {
			// Do nothing
		}
	}

	decryptPendingSubscriptions = async() => {
		const db = database.active;
		const subCollection = db.collections.get('subscriptions');
		try {
			const subsEncrypted = await subCollection.query(Q.where('encrypted', true)).fetch();
			// We can't do this on database level since lastMessage is not a database object
			const subsToDecrypt = subsEncrypted.filter(sub => sub?.lastMessage?.e2e === E2E_STATUS.PENDING);
			subsToDecrypt.forEach(async(sub) => {
				try {
					const { lastMessage } = sub;
					const decryptedSub = await this.decryptSubscription({ lastMessage });
					db.action(() => sub.update((s) => {
						Object.assign(s, decryptedSub);
					}));
				} catch {
					// Do nothing
				}
			});
		} catch {
			// Do nothing
		}
	}

	decryptSubscription = async(subscription) => {
		if (!subscription?.lastMessage) {
			return subscription;
		}

		try {
			const { lastMessage } = subscription;
			const roomE2E = await this.getRoomInstance(lastMessage.rid);
			const decryptedMessage = await roomE2E.decrypt(lastMessage);
			return {
				...subscription,
				lastMessage: decryptedMessage
			};
		} catch {
			// Do nothing
		}

		return subscription;
	}

	encryptMessage = async(message) => {
		try {
			// TODO: We should await room instance handshake and this class ready
			const roomE2E = await this.getRoomInstance(message.rid);
			return roomE2E.encrypt(message);
		} catch {
			// Do nothing
		}

		return message;
	}

	decryptMessage = async(message) => {
		try {
			// TODO: We should await room instance handshake and this class ready
			const roomE2E = await this.getRoomInstance(message.rid);
			return roomE2E.decrypt(message);
		} catch {
			// Do nothing
		}

		return message;
	}
}

const encryption = new Encryption();
export default encryption;

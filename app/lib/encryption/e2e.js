import EJSON from 'ejson';
import SimpleCrypto from 'react-native-simple-crypto';
import prompt from 'react-native-prompt-android';
import RNUserDefaults from 'rn-user-defaults';

import {
	toString,
	utf8ToBuffer,
	splitVectorData,
	randomPassword,
	jwkToPkcs1
} from './utils';
import {
	E2E_PUBLIC_KEY,
	E2E_PRIVATE_KEY,
	E2E_RANDOM_PASSWORD_KEY
} from './constants';
import RocketChat from '../rocketchat';
import E2ERoom from './e2e.room';
import store from '../createStore';
import I18n from '../../i18n';

class E2E {
	constructor() {
		this.started = false;
		this.roomInstances = {};
	}

	start = async() => {
		// TODO: Do this better
		const { E2E_Enable } = store.getState().settings;
		if (!E2E_Enable) {
			return;
		}

		if (this.started) {
			return;
		}

		// TODO: Do this better
		this.userId = store.getState().login.user.id;

		this.started = true;

		const storedPublicKey = await RNUserDefaults.get(E2E_PUBLIC_KEY);
		const storedPrivateKey = await RNUserDefaults.get(E2E_PRIVATE_KEY);

		const { publicKey, privateKey } = await this.fetchMyKeys();

		const pubKey = EJSON.parse(storedPublicKey || publicKey);
		let privKey = storedPrivateKey;
		if (!storedPrivateKey && privateKey) {
			privKey = await this.decodePrivateKey(privateKey);
		}

		if (pubKey && privKey) {
			this.loadKeys(pubKey, privKey);
		}
	}

	stop = () => {
		this.started = false;
		this.roomInstances = {};
	}

	loadKeys = async(publicKey, privateKey) => {
		try {
			await RNUserDefaults.set(E2E_PUBLIC_KEY, EJSON.stringify(publicKey));

			this.privateKey = await jwkToPkcs1(EJSON.parse(privateKey));
			await RNUserDefaults.set(E2E_PRIVATE_KEY, privateKey);
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
		await RNUserDefaults.set(E2E_RANDOM_PASSWORD_KEY, password);
		return password;
	}

	getRoomInstance = async(rid) => {
		if (this.roomInstances[rid]) {
			return this.roomInstances[rid];
		}

		const roomE2E = new E2ERoom(rid);
		this.roomInstances[rid] = roomE2E;
		await roomE2E.handshake();

		return roomE2E;
	}

	// Decrypt messages
	decrypt = async(message) => {
		// TODO: We should await room instance handshake and this class ready
		const roomE2E = await this.getRoomInstance(message.rid);
		return roomE2E.decrypt(message);
	}
}

const e2e = new E2E();
export default e2e;

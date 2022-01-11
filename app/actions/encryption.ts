import { Action } from 'redux';

import { ENCRYPTION } from './actionsTypes';

interface IEncryptionSetBanner extends Action {
	banner: null | any;
}

interface IEncryptionSet extends Action, IEncryptionSetBanner {
	enabled: boolean;
}

interface IEncryptionDecodeKey extends Action {
	password: string;
}

export type TActionEncryption = IEncryptionSetBanner & IEncryptionSet & IEncryptionDecodeKey;

export function encryptionInit(): Action {
	return {
		type: ENCRYPTION.INIT
	};
}

export function encryptionStop(): Action {
	return {
		type: ENCRYPTION.STOP
	};
}

export function encryptionSet(enabled = false, banner: null | any): IEncryptionSet {
	return {
		type: ENCRYPTION.SET,
		enabled,
		banner
	};
}

export function encryptionSetBanner(banner: null | any): IEncryptionSetBanner {
	return {
		type: ENCRYPTION.SET_BANNER,
		banner
	};
}

export function encryptionDecodeKey(password: string): IEncryptionDecodeKey {
	return {
		type: ENCRYPTION.DECODE_KEY,
		password
	};
}

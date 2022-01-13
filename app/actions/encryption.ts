import { Action } from 'redux';

import { ENCRYPTION } from './actionsTypes';

export interface IEncryptionSet extends Action {
	enabled: boolean;
	banner: any;
}

export interface IEncryptionSetBanner extends Action {
	banner: any;
}
export interface IEncryptionDecodeKey extends Action {
	password: string;
}

export type TActionEncryption = IEncryptionSet & IEncryptionSetBanner & IEncryptionDecodeKey;

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

export function encryptionSet(enabled = false, banner: any = null): IEncryptionSet {
	return {
		type: ENCRYPTION.SET,
		enabled,
		banner
	};
}

export function encryptionSetBanner(banner: any = null): IEncryptionSetBanner {
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

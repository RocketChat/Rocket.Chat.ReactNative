import { Action } from 'redux';

import { IBanner } from '../reducers/encryption';
import { ENCRYPTION } from './actionsTypes';

export interface IEncryptionSet extends Action {
	enabled: boolean;
	banner: IBanner;
}

export interface IEncryptionSetBanner extends Action {
	banner: IBanner;
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

export function encryptionSet(enabled = false, banner: IBanner = ''): IEncryptionSet {
	return {
		type: ENCRYPTION.SET,
		enabled,
		banner
	};
}

export function encryptionSetBanner(banner: IBanner = ''): IEncryptionSetBanner {
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

export function encryptionDecodeKeyFailure(): Action {
	return {
		type: ENCRYPTION.DECODE_KEY_FAILURE
	};
}

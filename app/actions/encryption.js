import * as types from './actionsTypes';

export function encryptionInit() {
	return {
		type: types.ENCRYPTION.INIT
	};
}

export function encryptionStop() {
	return {
		type: types.ENCRYPTION.STOP
	};
}

export function encryptionSet(enabled = false, banner = null) {
	return {
		type: types.ENCRYPTION.SET,
		enabled,
		banner
	};
}

export function encryptionSetBanner(banner) {
	return {
		type: types.ENCRYPTION.SET_BANNER,
		banner
	};
}

export function encryptionDecodeKey(password) {
	return {
		type: types.ENCRYPTION.DECODE_KEY,
		password
	};
}

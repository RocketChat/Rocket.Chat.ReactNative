import * as types from './actionsTypes';

export function encryptionInit() {
	return {
		type: types.ENCRYPTION.INIT
	};
}

export function encryptionSet(enabled) {
	return {
		type: types.ENCRYPTION.SET,
		enabled
	};
}

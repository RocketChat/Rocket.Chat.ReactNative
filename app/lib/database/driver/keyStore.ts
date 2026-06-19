/**
 * Thin JS shim that wraps the native DatabaseKeyStore TurboModule and satisfies
 * IKeychainShim, then installs it into keyService via installKeychainShim.
 *
 * Call installNativeKeychainShim() once before any database is opened.
 * The right place is app startup, before the first call to openServersDb /
 * openServerDb.  The driver facade will call this as part of its own init;
 * until that ticket lands, call it from the app entry point (app/index.tsx).
 */

import NativeDatabaseKeyStore from '../../native/NativeDatabaseKeyStore';
import { installKeychainShim, type IKeychainShim } from './keyService';

let _installed = false;

function getNativeModule() {
	if (!NativeDatabaseKeyStore) {
		throw new Error('DatabaseKeyStore native module not found — ensure the module is linked and the app is rebuilt');
	}
	return NativeDatabaseKeyStore;
}

function makeNativeShim(): IKeychainShim {
	const native = getNativeModule();
	return {
		getItem: (key: string) => native.getItem(key),
		setItem: (key: string, value: string) => native.setItem(key, value),
		removeItem: (key: string) => native.removeItem(key)
	};
}

/**
 * Installs the native Keychain/Keystore shim into the key service.
 * Must be called once before any database is opened.
 * No-op after the first successful install.
 */
export function installNativeKeychainShim(): void {
	if (_installed) return;
	installKeychainShim(makeNativeShim());
	_installed = true;
}

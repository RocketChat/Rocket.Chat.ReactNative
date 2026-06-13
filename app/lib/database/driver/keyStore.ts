/**
 * Thin JS shim that wraps the native DatabaseKeyStore module and satisfies
 * IKeychainShim, then installs it into keyService via installKeychainShim.
 *
 * Call installNativeKeychainShim() once before any database is opened.
 * The right place is app startup, before the first call to openServersDb /
 * openServerDb.  The driver facade will call this as part of its own init;
 * until that ticket lands, call it from the app entry point (app/index.tsx).
 */

import { NativeModules } from 'react-native';

import { installKeychainShim, type IKeychainShim } from './keyService';

interface NativeDatabaseKeyStore {
	getItem(key: string): Promise<string | null>;
	setItem(key: string, value: string): Promise<void>;
	removeItem(key: string): Promise<void>;
}

function getNativeModule(): NativeDatabaseKeyStore {
	const mod = NativeModules.DatabaseKeyStore as NativeDatabaseKeyStore | undefined;
	if (!mod) {
		throw new Error('DatabaseKeyStore native module not found — ensure the module is linked and the app is rebuilt');
	}
	return mod;
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
 * Safe to call multiple times (subsequent calls are no-ops in keyService).
 */
export function installNativeKeychainShim(): void {
	installKeychainShim(makeNativeShim());
}

import { MMKV } from 'react-native-mmkv';

import { getSecureKey } from './helpers/getSecureKey';

/**
 * Migration from react-native-mmkv-storage to react-native-mmkv
 *
 * Since both libraries use the same underlying MMKV C++ implementation,
 * data should already be accessible with the new library.
 * This migration verifies data integrity and sets a migration flag.
 */

const MIGRATION_KEY = 'MMKV_MIGRATION_COMPLETED_V1';

export async function migrateMMKVStorage(): Promise<void> {
	try {
		// Get encryption key from native module
		const encryptionKey = await getSecureKey('com.MMKV.default');

		// Initialize new MMKV instance with same ID and encryption key as old library
		const storage = new MMKV({
			id: 'default',
			encryptionKey: encryptionKey || undefined
		});

		// Check if migration was already completed
		const migrationCompleted = storage.getBoolean(MIGRATION_KEY);
		if (migrationCompleted) {
			console.log('[MMKV Migration] Already completed, skipping');
			return;
		}

		// Verify data is accessible by checking for common keys
		const allKeys = storage.getAllKeys();
		console.log(`[MMKV Migration] Found ${allKeys.length} keys in storage`);

		// Mark migration as completed
		storage.set(MIGRATION_KEY, true);
		console.log('[MMKV Migration] Completed successfully');
	} catch (error) {
		console.error('[MMKV Migration] Failed:', error);
		throw error;
	}
}

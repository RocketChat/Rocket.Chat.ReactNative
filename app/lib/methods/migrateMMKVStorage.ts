import { MMKV } from 'react-native-mmkv';

import MMKVReader from '../native/NativeMMKVReader';
import { isAndroid } from './helpers';
import userPreferences from './userPreferences';

export async function migrateFromOldMMKV(oldInstanceId: string = 'default', newStorage?: MMKV) {
	const errors: string[] = [];
	userPreferences.setBool('WORKSPACE_MIGRATION_COMPLETED', false);

	try {
		if (!MMKVReader || !isAndroid) {
			console.log('MMKVReader module not available - skipping migration');
			return;
		}

		// Step 1: Read and decrypt old MMKV data using our native module
		console.log('Step 1: Reading old MMKV data...');
		const oldData = await MMKVReader.readAndDecryptMMKV(oldInstanceId);

		const allKeys = Object.keys(oldData);

		if (allKeys.length === 0) {
			console.log('No data to migrate');
			return {
				success: true,
				keysFound: 0,
				keysMigrated: 0,
				errors: [],
				data: oldData
			};
		}

		// Step 2: Create or use new MMKV storage
		const targetStorage = newStorage || new MMKV({ id: 'default' });

		// Step 3: Migrate data
		console.log('Step 2: Migrating data to new MMKV...');

		// Migrate all key-value pairs
		for (const key of allKeys) {
			const value = oldData[key];

			try {
				// Determine the type and write appropriately
				if (typeof value === 'string') {
					targetStorage.set(key, value);
				} else if (typeof value === 'number') {
					targetStorage.set(key, value);
				} else if (typeof value === 'boolean') {
					targetStorage.set(key, value);
				}
			} catch (error: any) {
				const errorMsg = `Failed to migrate key "${key}": ${error.message}`;
				errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		console.log('=== Migration Complete ===');
	} catch (error: any) {
		const errorMsg = `Migration failed: ${error.message}`;
		console.error(errorMsg);
	}
}

export default migrateFromOldMMKV;

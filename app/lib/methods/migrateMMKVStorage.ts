import { MMKV } from 'react-native-mmkv';

import MMKVReader from '../native/NativeMMKVReader';
import { isAndroid } from './helpers';

export async function migrateFromOldMMKV(oldInstanceId: string = 'default', newStorage?: MMKV) {
	const errors: string[] = [];

	try {
		if (!MMKVReader || !isAndroid) {
			console.log('MMKVReader module not available - skipping migration');
			return;
		}

		// Step 1: Read and decrypt old MMKV data using our native module
		console.log('Step 1: Reading old MMKV data...');
		const oldData = await MMKVReader.readAndDecryptMMKV(oldInstanceId);

		const allKeys = Object.keys(oldData);
		console.log(`Found ${allKeys.length} entries in old storage`);

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
		let migratedCount = 0;

		// Migrate all key-value pairs
		for (const key of allKeys) {
			const value = oldData[key];

			try {
				// Determine the type and write appropriately
				if (typeof value === 'string') {
					targetStorage.set(key, value);
					const displayValue = value.length > 50 ? `${value.substring(0, 50)}...` : value;
					console.log(`✓ String: ${key} = ${displayValue}`);
					migratedCount++;
				} else if (typeof value === 'number') {
					targetStorage.set(key, value);
					console.log(`✓ Number: ${key} = ${value}`);
					migratedCount++;
				} else if (typeof value === 'boolean') {
					targetStorage.set(key, value);
					console.log(`✓ Boolean: ${key} = ${value}`);
					migratedCount++;
				} else {
					console.warn(`⚠️  Skipping unknown type for key: ${key} (type: ${typeof value})`);
				}
			} catch (error: any) {
				const errorMsg = `Failed to migrate key "${key}": ${error.message}`;
				errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		console.log('=== Migration Complete ===');
		console.log(`Total entries found: ${allKeys.length}`);
		console.log(`Successfully migrated: ${migratedCount}`);
		console.log(`Errors: ${errors.length}`);

		return {
			success: errors.length === 0,
			keysFound: allKeys.length,
			keysMigrated: migratedCount,
			errors,
			data: oldData
		};
	} catch (error: any) {
		const errorMsg = `Migration failed: ${error.message}`;
		console.error(errorMsg);
		errors.push(errorMsg);

		return {
			success: false,
			keysFound: 0,
			keysMigrated: 0,
			errors
		};
	}
}

export default migrateFromOldMMKV;

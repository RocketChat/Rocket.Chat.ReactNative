import MMKVMigrationStatus from '../native/NativeMMKVMigrationStatus';
import UserPreferences from './userPreferences';

/**
 * Check MMKV migration status - useful for debugging TestFlight issues
 */
export async function checkMigrationStatus() {
	try {
		const status = await MMKVMigrationStatus.getMigrationStatus();

		console.log('=== MMKV Migration Status ===');
		console.log(`Completed: ${status.completed}`);
		console.log(`Timestamp: ${status.timestamp}`);
		console.log(`Keys Migrated: ${status.keysMigrated}`);
		console.log(`Bundle ID: ${status.bundleId}`);

		// Check actual keys in storage
		const allKeys = UserPreferences.getAllKeys();
		console.log(`\nCurrent keys in storage: ${allKeys.length}`);

		if (allKeys.length > 0) {
			console.log('Sample keys:', allKeys.slice(0, 20));

			// Check for important keys
			const currentServer = UserPreferences.getString('CURRENT_SERVER');
			console.log(`\nCURRENT_SERVER: ${currentServer || 'NOT FOUND'}`);

			if (currentServer) {
				const token = UserPreferences.getString(`reactnativemeteor_usertoken-${currentServer}`);
				console.log(`User token exists: ${token ? 'YES' : 'NO'}`);
			}
		}

		return {
			...status,
			keysInStorage: allKeys.length,
			hasServer: !!UserPreferences.getString('CURRENT_SERVER')
		};
	} catch (error) {
		console.error('Error checking migration status:', error);
		return null;
	}
}

/**
 * Reset migration flag - ONLY for debugging/testing
 */
export async function resetMigration() {
	try {
		await MMKVMigrationStatus.resetMigration();
		console.log('Migration flag reset - restart app to re-run migration');
	} catch (error) {
		console.error('Error resetting migration:', error);
	}
}

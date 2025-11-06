import { NativeModules } from 'react-native';

interface IMMKVMigrationStatus {
	getMigrationStatus(): Promise<{
		completed: boolean;
		timestamp: string;
		keysMigrated: number;
		bundleId: string;
	}>;
	resetMigration(): Promise<{ reset: boolean }>;
}

export default NativeModules.MMKVMigrationStatus as IMMKVMigrationStatus;


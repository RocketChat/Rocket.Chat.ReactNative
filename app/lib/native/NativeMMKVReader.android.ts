import { type TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	getStoragePath(): Promise<{
		filesDir: string;
		mmkvDir: string;
		mmkvDirExists: boolean;
	}>;
	listMMKVFiles(): Promise<
		Array<{
			name: string;
			path: string;
			size: number;
			isFile: boolean;
		}>
	>;
	readAndDecryptMMKV(mmkvId: string): Promise<Record<string, string>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MMKVReader');

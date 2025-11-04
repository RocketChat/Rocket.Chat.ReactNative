import { NativeModules } from 'react-native';

export interface Spec {
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

export default NativeModules.MMKVReader as Spec;

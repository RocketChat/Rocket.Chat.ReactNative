// This file is a fallback for TypeScript.
import { type TurboModule } from 'react-native';

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

declare const MMKVReader: Spec | null;

export default MMKVReader;

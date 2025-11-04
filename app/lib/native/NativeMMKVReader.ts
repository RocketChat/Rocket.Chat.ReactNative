// This file is a fallback for TypeScript. Metro will use platform-specific files at runtime.
// iOS doesn't need MMKV migration, so we export null
export interface MMKVReaderModule {
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

declare const MMKVReader: MMKVReaderModule | null;

export default MMKVReader;

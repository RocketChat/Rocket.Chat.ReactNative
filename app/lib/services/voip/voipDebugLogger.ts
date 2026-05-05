import * as FileSystem from 'expo-file-system/legacy';

const LOG_FILE = `${FileSystem.documentDirectory ?? ''}voip-debug.log`;

const ts = () => new Date().toISOString();

const safeStringify = (value: unknown): string => {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

let writeChain: Promise<void> = Promise.resolve();
let lastError: string | null = null;

const append = (line: string) => {
	writeChain = writeChain
		.then(async () => {
			try {
				const info = await FileSystem.getInfoAsync(LOG_FILE);
				const existing = info.exists ? await FileSystem.readAsStringAsync(LOG_FILE) : '';
				await FileSystem.writeAsStringAsync(LOG_FILE, `${existing}${line}\n`);
				lastError = null;
			} catch (e) {
				lastError = String(e);
			}
		})
		.catch(() => {
			// never break the chain
		});
};

export const voipDebugLog = (tag: string, msg: string, data?: unknown) => {
	const line = `${ts()} [${tag}] ${msg}${data !== undefined ? ` ${safeStringify(data)}` : ''}`;
	console.log(line);
	append(line);
};

export const voipDebugFlush = () => writeChain;

export const voipDebugGetPath = () => LOG_FILE;

export const voipDebugLastError = () => lastError;

export const voipDebugClear = async () => {
	try {
		const info = await FileSystem.getInfoAsync(LOG_FILE);
		if (info.exists) await FileSystem.deleteAsync(LOG_FILE);
	} catch {
		// best-effort
	}
};

export const voipDebugRead = async (): Promise<string> => {
	await writeChain;
	try {
		const info = await FileSystem.getInfoAsync(LOG_FILE);
		if (!info.exists) return '';
		return await FileSystem.readAsStringAsync(LOG_FILE);
	} catch {
		return '';
	}
};

voipDebugLog('module', '------------>  voipDebugLogger loaded', { path: LOG_FILE });

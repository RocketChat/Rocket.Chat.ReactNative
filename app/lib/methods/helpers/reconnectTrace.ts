import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// Temporary reconnect-latency instrumentation. Dev-only, dropped before merge.
// Marks land in a file so they survive background/lock (Metro is disconnected then),
// and are dumped to the Metro console a few seconds after each foreground.

const TRACE_FILE = `${FileSystem.documentDirectory}reconnect-trace.log`;
const SESSION_GAP_MS = 60_000;

const marks: string[] = [];
let loaded = false;

const persist = (): void => {
	FileSystem.writeAsStringAsync(TRACE_FILE, marks.join('\n')).catch(() => {});
};

const loadMarks = async (): Promise<void> => {
	if (loaded) {
		return;
	}
	loaded = true;
	try {
		const content = await FileSystem.readAsStringAsync(TRACE_FILE);
		// unshift: file content is always older than anything marked this run
		marks.unshift(...content.split('\n').filter(Boolean));
	} catch {
		// first run: no file yet
	}
};

export const reconnectMark = (name: string, detail?: string): void => {
	if (!__DEV__) {
		return;
	}
	const now = Date.now();
	const last = marks[marks.length - 1];
	if (name === 'app-foreground' && last && now - Number(last.split(' ')[0]) > SESSION_GAP_MS) {
		marks.push(`${now} === session ===`);
	}
	const line = `${now} ${name}${detail ? ` ${detail}` : ''}`;
	marks.push(line);
	console.log(`[trace] ${line}`);
	persist();
};

const dump = async (): Promise<void> => {
	await loadMarks();
	if (marks.length === 0) {
		return;
	}
	let previous = 0;
	const lines = marks.map(line => {
		const [t, ...rest] = line.split(' ');
		const time = Number(t);
		const delta = previous ? `+${time - previous}ms` : 'start';
		previous = time;
		return `${new Date(time).toISOString().slice(11, 23)} ${delta.padStart(8)} ${rest.join(' ')}`;
	});
	console.log(`[trace] dump\n${lines.join('\n')}`);
};

// tests mock react-native without AppState events
if (__DEV__ && typeof AppState?.addEventListener === 'function') {
	loadMarks();
	AppState.addEventListener('change', state => {
		if (state !== 'active') {
			return;
		}
		// Metro needs a moment to reconnect after foreground; dump twice to also catch late marks
		setTimeout(dump, 8000);
		setTimeout(dump, 25000);
	});
}

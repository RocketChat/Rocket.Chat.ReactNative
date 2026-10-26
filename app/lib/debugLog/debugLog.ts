export type TDebugLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface IDebugLogEntry {
	ts: number;
	level: TDebugLogLevel;
	message: string;
}

const MAX_ENTRIES = 500;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LINES = 6;
const CONSOLE_LEVELS: TDebugLogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

const entries: IDebugLogEntry[] = [];
const listeners = new Set<() => void>();

const formatValue = (value: unknown): string => {
	if (typeof value === 'string') {
		return value;
	}
	if (value instanceof Error) {
		const stack = value.stack?.split('\n').slice(0, MAX_STACK_LINES).join('\n');
		return `${value.name}: ${value.message}${stack ? `\n${stack}` : ''}`;
	}
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
};

const trim = () => {
	if (entries.length > MAX_ENTRIES) {
		entries.splice(0, entries.length - MAX_ENTRIES);
	}
};

const notify = () => listeners.forEach(listener => listener());

export const appendDebugLog = (level: TDebugLogLevel, args: unknown[]): void => {
	const message = args.map(formatValue).join(' ').slice(0, MAX_MESSAGE_LENGTH);
	entries.push({ ts: Date.now(), level, message });
	trim();
	notify();
};

// Puts a previous session's entries before the current one, separated by a launch marker.
export const restoreDebugLogs = (previous: IDebugLogEntry[]): void => {
	entries.unshift(...previous, { ts: Date.now(), level: 'info', message: '---- app launched ----' });
	trim();
	notify();
};

export const getDebugLogs = (): IDebugLogEntry[] => entries.slice();

export const clearDebugLogs = (): void => {
	entries.length = 0;
	notify();
};

export const subscribeDebugLogs = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const formatDebugLogEntry = ({ ts, level, message }: IDebugLogEntry): string =>
	`${new Date(ts).toISOString()} [${level}] ${message}`;

// With `forward` off the console stays silent, as release builds expect, but every call is still recorded.
export const captureConsole = ({ forward }: { forward: boolean }): void => {
	CONSOLE_LEVELS.forEach(level => {
		const original = console[level];
		console[level] = (...args: unknown[]) => {
			appendDebugLog(level, args);
			if (forward) {
				original(...args);
			}
		};
	});
};

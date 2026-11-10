import { create } from 'zustand';

const MAX_ENTRIES = 1000;

export type VoipDebugLogLevel = 'log' | 'debug' | 'warn' | 'error';

export interface VoipDebugLogEntry {
	id: number;
	time: number;
	level: VoipDebugLogLevel;
	tag: string;
	message: string;
	data?: string;
}

interface VoipDebugLogStore {
	entries: VoipDebugLogEntry[];
	clear: () => void;
}

let nextId = 0;

export const useVoipDebugLogStore = create<VoipDebugLogStore>(set => ({
	entries: [],
	clear: () => set({ entries: [] })
}));

function safeStringify(value: unknown): string {
	if (value === undefined) {
		return 'undefined';
	}
	if (value instanceof Error) {
		return JSON.stringify({
			name: value.name,
			message: value.message,
			stack: value.stack
		});
	}
	const seen = new WeakSet();
	try {
		return JSON.stringify(value, (_key, v) => {
			if (v instanceof Error) {
				return { name: v.name, message: v.message, stack: v.stack };
			}
			if (typeof v === 'object' && v !== null) {
				if (seen.has(v)) {
					return '[Circular]';
				}
				seen.add(v);
			}
			return v;
		});
	} catch {
		return String(value);
	}
}

export function voipDebugLog(tag: string, message: string, data?: unknown, level: VoipDebugLogLevel = 'log'): void {
	try {
		appendEntry(tag, message, data, level);
	} catch {
		// diagnostics must never break the caller
	}
}

function appendEntry(tag: string, message: string, data: unknown, level: VoipDebugLogLevel): void {
	const entry: VoipDebugLogEntry = {
		id: nextId++,
		time: Date.now(),
		level,
		tag,
		message,
		data: data === undefined ? undefined : safeStringify(data)
	};
	useVoipDebugLogStore.setState(state => {
		const entries = state.entries.length >= MAX_ENTRIES ? state.entries.slice(-MAX_ENTRIES + 1) : state.entries.slice();
		entries.push(entry);
		return { entries };
	});
}

export function formatVoipDebugLogEntry(entry: VoipDebugLogEntry): string {
	const time = new Date(entry.time).toISOString();
	const data = entry.data ? ` ${entry.data}` : '';
	return `${time} [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}${data}`;
}

export function formatVoipDebugLogs(): string {
	return useVoipDebugLogStore.getState().entries.map(formatVoipDebugLogEntry).join('\n');
}

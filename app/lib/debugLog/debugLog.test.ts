import {
	appendDebugLog,
	captureConsole,
	clearDebugLogs,
	formatDebugLogEntry,
	getDebugLogs,
	restoreDebugLogs,
	subscribeDebugLogs
} from './debugLog';

describe('debugLog', () => {
	beforeEach(() => {
		clearDebugLogs();
	});

	it('formats strings, errors and objects into one message', () => {
		appendDebugLog('error', ['connect error', new Error('boom'), { code: 1006 }]);

		const [entry] = getDebugLogs();
		expect(entry.level).toBe('error');
		expect(entry.message).toContain('connect error Error: boom');
		expect(entry.message).toContain('{"code":1006}');
	});

	it('keeps only the newest 500 entries', () => {
		for (let i = 0; i < 510; i += 1) {
			appendDebugLog('log', [`line ${i}`]);
		}

		const entries = getDebugLogs();
		expect(entries).toHaveLength(500);
		expect(entries[0].message).toBe('line 10');
	});

	it('puts restored entries before the current session with a launch marker', () => {
		appendDebugLog('log', ['current']);
		restoreDebugLogs([{ ts: 1, level: 'log', message: 'previous' }]);

		expect(getDebugLogs().map(({ message }) => message)).toEqual(['previous', '---- app launched ----', 'current']);
	});

	it('notifies subscribers and stops after unsubscribe', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeDebugLogs(listener);
		appendDebugLog('log', ['one']);
		unsubscribe();
		appendDebugLog('log', ['two']);

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('records console calls and only forwards them when asked', () => {
		const original = console.warn;
		const spy = jest.fn();
		console.warn = spy;
		try {
			captureConsole({ forward: false });
			console.warn('silent');
			expect(spy).not.toHaveBeenCalled();

			console.warn = spy;
			captureConsole({ forward: true });
			console.warn('loud');
			expect(spy).toHaveBeenCalledWith('loud');
		} finally {
			console.warn = original;
		}

		expect(getDebugLogs().map(({ message }) => message)).toEqual(['silent', 'loud']);
	});

	it('formats an entry with its timestamp and level', () => {
		expect(formatDebugLogEntry({ ts: 0, level: 'warn', message: 'hi' })).toBe('1970-01-01T00:00:00.000Z [warn] hi');
	});
});

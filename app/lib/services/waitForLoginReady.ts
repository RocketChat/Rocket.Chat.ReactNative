import { store } from '../store/auxStore';

export function classifySocketHealth(ddp: {
	lastPing: number;
	pingInterval?: number;
	config?: { ping?: number };
}): 'healthy' | 'probe' | 'reopen' {
	const pingInterval = (ddp.pingInterval ?? ddp.config?.ping) || 10000;
	const age = Date.now() - ddp.lastPing;
	if (age > pingInterval * 2) {
		return 'reopen';
	}
	if (age > pingInterval) {
		return 'probe';
	}
	return 'healthy';
}

// Trusts redux state rather than `ddp.loggedIn`, which isn't cleared on socket close and can read true for a stale session.
export function isLoginReady(): boolean {
	const state = store.getState();
	return state.login.isAuthenticated && state.meteor.connected;
}

function onAbort(signal: AbortSignal | undefined, callback: () => void): void {
	if (!signal) {
		return;
	}
	if (signal.aborted) {
		callback();
		return;
	}
	if ('addEventListener' in signal) {
		signal.addEventListener('abort', callback, { once: true });
	} else {
		// Fallback for older runtimes where AbortSignal only exposes onabort.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(signal as any).onabort = callback;
	}
}

export function waitForLoginReady(timeoutMs: number, abortSignal?: AbortSignal): Promise<boolean> {
	return new Promise(resolve => {
		if (abortSignal?.aborted) {
			return resolve(false);
		}
		if (isLoginReady()) {
			return resolve(true);
		}

		let settled = false;
		const finish = (value: boolean) => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timer);
			unsub();
			resolve(value);
		};

		const unsub = store.subscribe(() => {
			if (isLoginReady()) {
				finish(true);
			}
		});
		const timer = setTimeout(() => finish(false), timeoutMs);
		onAbort(abortSignal, () => finish(false));
	});
}

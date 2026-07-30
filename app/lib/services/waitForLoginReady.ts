import { store } from '../store/auxStore';

// Reads redux rather than `ddp.loggedIn`: `close` clears `meteor.connected`, while `ddp.loggedIn` survives it.
// Neither survives a silent background death, so callers must bound their wait.
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
		const legacy = signal as unknown as { onabort: (() => void) | null };
		legacy.onabort = callback;
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

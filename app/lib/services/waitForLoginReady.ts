import { onAbort } from '../methods/helpers/onAbort';
import { store } from '../store/auxStore';

// Reads redux rather than `socket.loggedIn`: `close` clears `meteor.connected`, while `socket.loggedIn` survives it.
// Neither survives a silent background death, so callers must bound their wait.
export function isLoginReady(): boolean {
	const state = store.getState();
	return state.login.isAuthenticated && state.meteor.connected;
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

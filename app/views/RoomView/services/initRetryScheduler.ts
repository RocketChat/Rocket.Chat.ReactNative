const INITIAL_RETRY_DELAY = 300;
const MAX_RETRY_DELAY = 10000;
export const INIT_MAX_RETRY_ATTEMPTS = 5;

// A failing room init used to re-fire every 300ms forever, so a server that keeps
// rejecting turned one open room into a request storm. Back off between attempts and
// stop after the budget is spent; the budget is restored once an init succeeds.
export class InitRetryScheduler {
	private attempts = 0;
	private timeout?: ReturnType<typeof setTimeout>;

	schedule(retry: () => void): boolean {
		if (this.attempts >= INIT_MAX_RETRY_ATTEMPTS) {
			return false;
		}
		const delay = Math.min(INITIAL_RETRY_DELAY * 2 ** this.attempts, MAX_RETRY_DELAY);
		this.attempts += 1;
		this.cancel();
		this.timeout = setTimeout(retry, delay);
		return true;
	}

	reset(): void {
		this.attempts = 0;
		this.cancel();
	}

	cancel(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}
}

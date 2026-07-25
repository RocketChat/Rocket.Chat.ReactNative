const INITIAL_RETRY_DELAY = 300;
export const INIT_MAX_RETRY_DELAY = 10000;

// A failing room init used to re-fire every 300ms forever, so a server that keeps
// rejecting turned one open room into a request storm. What is capped is the rate, not
// the number of attempts: the delay doubles up to the floor and stays there, because
// nothing else re-enters init() for an authenticated room and a room that stopped
// retrying has no error UI and no way back other than leaving it.
export class InitRetryScheduler {
	private attempts = 0;
	private timeout?: ReturnType<typeof setTimeout>;

	/** True until the first retry since the last reset is armed: the failure worth recording. */
	get isFirstAttempt(): boolean {
		return this.attempts === 0;
	}

	schedule(retry: () => void): void {
		const delay = Math.min(INITIAL_RETRY_DELAY * 2 ** this.attempts, INIT_MAX_RETRY_DELAY);
		this.attempts += 1;
		this.cancel();
		this.timeout = setTimeout(retry, delay);
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

import { INIT_MAX_RETRY_ATTEMPTS, InitRetryScheduler } from './initRetryScheduler';

describe('InitRetryScheduler', () => {
	beforeEach(() => jest.useFakeTimers());

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	const drain = (scheduler: InitRetryScheduler, retry: () => void, attempts: number) => {
		const scheduled: boolean[] = [];
		for (let attempt = 0; attempt < attempts; attempt += 1) {
			scheduled.push(scheduler.schedule(retry));
			jest.runOnlyPendingTimers();
		}
		return scheduled;
	};

	it('backs off exponentially instead of retrying at a fixed interval', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();

		const delays: number[] = [];
		for (let attempt = 0; attempt < INIT_MAX_RETRY_ATTEMPTS; attempt += 1) {
			const before = Date.now();
			scheduler.schedule(retry);
			jest.runOnlyPendingTimers();
			delays.push(Date.now() - before);
		}

		expect(delays).toEqual([300, 600, 1200, 2400, 4800]);
		expect(retry).toHaveBeenCalledTimes(INIT_MAX_RETRY_ATTEMPTS);
	});

	it('gives up once the attempt cap is reached and schedules nothing more', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();

		const scheduled = drain(scheduler, retry, INIT_MAX_RETRY_ATTEMPTS);
		expect(scheduled.every(Boolean)).toBe(true);

		expect(scheduler.schedule(retry)).toBe(false);
		jest.runOnlyPendingTimers();
		expect(retry).toHaveBeenCalledTimes(INIT_MAX_RETRY_ATTEMPTS);
	});

	it('reset restores the full budget and the initial delay', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();
		drain(scheduler, retry, INIT_MAX_RETRY_ATTEMPTS);

		scheduler.reset();

		const before = Date.now();
		expect(scheduler.schedule(retry)).toBe(true);
		jest.runOnlyPendingTimers();
		expect(Date.now() - before).toBe(300);
		expect(retry).toHaveBeenCalledTimes(INIT_MAX_RETRY_ATTEMPTS + 1);
	});

	it('cancel drops a pending retry without spending the budget already used', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();

		scheduler.schedule(retry);
		scheduler.cancel();
		jest.runOnlyPendingTimers();

		expect(retry).not.toHaveBeenCalled();
	});

	it('reset also drops a pending retry', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();

		scheduler.schedule(retry);
		scheduler.reset();
		jest.runOnlyPendingTimers();

		expect(retry).not.toHaveBeenCalled();
	});
});

import { INIT_MAX_RETRY_DELAY, InitRetryScheduler } from './initRetryScheduler';

describe('InitRetryScheduler', () => {
	beforeEach(() => jest.useFakeTimers());

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	const delaysOf = (scheduler: InitRetryScheduler, retry: () => void, attempts: number): number[] => {
		const delays: number[] = [];
		for (let attempt = 0; attempt < attempts; attempt += 1) {
			const before = Date.now();
			scheduler.schedule(retry);
			jest.runOnlyPendingTimers();
			delays.push(Date.now() - before);
		}
		return delays;
	};

	it('backs off exponentially instead of retrying at a fixed interval', () => {
		const retry = jest.fn();

		expect(delaysOf(new InitRetryScheduler(), retry, 5)).toEqual([300, 600, 1200, 2400, 4800]);
		expect(retry).toHaveBeenCalledTimes(5);
	});

	it('clamps the backoff at the delay floor and keeps retrying there indefinitely', () => {
		const retry = jest.fn();

		const delays = delaysOf(new InitRetryScheduler(), retry, 12);

		expect(delays.slice(6)).toEqual(Array(6).fill(INIT_MAX_RETRY_DELAY));
		// self-healing survives any number of failures: the room never stops trying
		expect(retry).toHaveBeenCalledTimes(12);
	});

	it('reset restores the initial delay', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();
		delaysOf(scheduler, retry, 8);

		scheduler.reset();

		expect(delaysOf(scheduler, retry, 1)).toEqual([300]);
	});

	it('cancel drops a pending retry', () => {
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

	it('keeps only the newest pending retry when scheduled twice', () => {
		const scheduler = new InitRetryScheduler();
		const retry = jest.fn();

		scheduler.schedule(retry);
		scheduler.schedule(retry);
		jest.runOnlyPendingTimers();

		expect(retry).toHaveBeenCalledTimes(1);
	});
});

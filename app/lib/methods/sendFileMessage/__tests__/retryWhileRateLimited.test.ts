import { retryWhileRateLimited } from '../retryWhileRateLimited';
import { HttpError } from '../../helpers/HttpError';

const RESPONSE = { file: { _id: 'abc', url: '/file/abc' } };

const onRetryWait = jest.fn().mockResolvedValue(undefined);

let controller: AbortController;

const run = (startStep: jest.Mock) => retryWhileRateLimited(controller.signal, startStep, onRetryWait);

const settle = (startStep: jest.Mock) => run(startStep).catch((e: unknown) => e);

const rateLimited = (options?: { serverMessage?: string; retryAfterSeconds?: number }) => new HttpError(429, options);

beforeEach(() => {
	jest.useFakeTimers();
	jest.spyOn(Math, 'random').mockReturnValue(0.5);
	controller = new AbortController();
	onRetryWait.mockClear();
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('retryWhileRateLimited', () => {
	it('resolves with what the step resolved', async () => {
		await expect(run(jest.fn().mockResolvedValue(RESPONSE))).resolves.toBe(RESPONSE);
	});

	it('starts the step again after a 429', async () => {
		const step = jest.fn().mockRejectedValueOnce(rateLimited()).mockResolvedValueOnce(RESPONSE);

		const pending = run(step);
		await jest.advanceTimersByTimeAsync(2000);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(step).toHaveBeenCalledTimes(2);
	});

	it('backs off exponentially, then gives up after the attempt limit with the last failure', async () => {
		const step = jest.fn().mockRejectedValue(rateLimited());

		const pending = settle(step);
		await jest.advanceTimersByTimeAsync(1999);
		expect(step).toHaveBeenCalledTimes(1);
		await jest.advanceTimersByTimeAsync(1);
		expect(step).toHaveBeenCalledTimes(2);
		await jest.advanceTimersByTimeAsync(4000);
		expect(step).toHaveBeenCalledTimes(3);
		await jest.advanceTimersByTimeAsync(8000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(step).toHaveBeenCalledTimes(4);
	});

	it('spreads its own backoff so a batch rate limited together does not retry at the same moment', async () => {
		(Math.random as jest.Mock).mockReturnValue(0);
		const early = jest.fn().mockRejectedValueOnce(rateLimited()).mockResolvedValueOnce(RESPONSE);
		const earlyRun = run(early);
		await jest.advanceTimersByTimeAsync(1000);
		await earlyRun;

		(Math.random as jest.Mock).mockReturnValue(0.99);
		const late = jest.fn().mockRejectedValueOnce(rateLimited()).mockResolvedValueOnce(RESPONSE);
		const lateRun = run(late);
		await jest.advanceTimersByTimeAsync(2900);
		expect(late).toHaveBeenCalledTimes(1);
		await jest.advanceTimersByTimeAsync(100);
		await lateRun;

		expect(early).toHaveBeenCalledTimes(2);
		expect(late).toHaveBeenCalledTimes(2);
	});

	it('does not retry before the rate limit window the server asked for has passed', async () => {
		const step = jest
			.fn()
			.mockRejectedValueOnce(rateLimited({ retryAfterSeconds: 60 }))
			.mockResolvedValueOnce(RESPONSE);

		const pending = run(step);
		await jest.advanceTimersByTimeAsync(59999);
		expect(step).toHaveBeenCalledTimes(1);
		await jest.advanceTimersByTimeAsync(1);

		await expect(pending).resolves.toBe(RESPONSE);
	});

	it('stops and surfaces the failure when the rate limit wait is longer than two minutes', async () => {
		const step = jest.fn().mockRejectedValue(rateLimited({ retryAfterSeconds: 3600 }));

		await expect(run(step)).rejects.toMatchObject({ status: 429 });
		expect(step).toHaveBeenCalledTimes(1);
	});

	it('gives up once the waits add up to more than two minutes', async () => {
		const step = jest
			.fn()
			.mockRejectedValueOnce(rateLimited({ retryAfterSeconds: 100 }))
			.mockRejectedValueOnce(rateLimited({ retryAfterSeconds: 30 }));

		const pending = settle(step);
		await jest.advanceTimersByTimeAsync(100000);

		await expect(pending).resolves.toMatchObject({ status: 429, retryAfterSeconds: 30 });
		expect(step).toHaveBeenCalledTimes(2);
		expect(onRetryWait).toHaveBeenCalledTimes(1);
	});

	it.each([[400], [413], [500], [503]])('does not retry a %p', async status => {
		const step = jest.fn().mockRejectedValue(new HttpError(status));

		await expect(run(step)).rejects.toMatchObject({ status });
		expect(step).toHaveBeenCalledTimes(1);
		expect(onRetryWait).not.toHaveBeenCalled();
	});

	it('does not retry a failure that is not an http error', async () => {
		const step = jest.fn().mockRejectedValue(new Error('Network Error'));

		await expect(run(step)).rejects.toThrow('Network Error');
		expect(step).toHaveBeenCalledTimes(1);
	});

	it('calls onRetryWait once for each wait', async () => {
		const step = jest
			.fn()
			.mockRejectedValueOnce(rateLimited())
			.mockRejectedValueOnce(rateLimited())
			.mockResolvedValueOnce(RESPONSE);

		const pending = run(step);
		await jest.advanceTimersByTimeAsync(6000);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(onRetryWait).toHaveBeenCalledTimes(2);
	});

	it('ends the wait as soon as it is cancelled without starting another attempt', async () => {
		const step = jest.fn().mockRejectedValue(rateLimited({ retryAfterSeconds: 60 }));

		const pending = settle(step);
		await jest.advanceTimersByTimeAsync(1000);
		controller.abort();

		await expect(pending).resolves.toThrow('Upload Cancelled');
		expect(step).toHaveBeenCalledTimes(1);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('does not start the step when it was cancelled before the first attempt', async () => {
		const step = jest.fn().mockResolvedValue(RESPONSE);
		controller.abort();

		await expect(run(step)).rejects.toThrow('Upload Cancelled');
		expect(step).not.toHaveBeenCalled();
	});

	it('does not resolve as successful when it was cancelled while the step ran', async () => {
		const step = jest.fn(() => {
			controller.abort();
			return Promise.resolve(RESPONSE);
		});

		await expect(run(step)).rejects.toThrow('Upload Cancelled');
	});

	it('does not wait out a 429 when it was cancelled while the step ran', async () => {
		const step = jest.fn(() => {
			controller.abort();
			return Promise.reject(rateLimited());
		});

		await expect(run(step)).rejects.toMatchObject({ status: 429 });
		expect(step).toHaveBeenCalledTimes(1);
		expect(onRetryWait).not.toHaveBeenCalled();
	});
});

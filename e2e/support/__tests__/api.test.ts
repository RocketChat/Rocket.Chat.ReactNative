import { get, login } from '../api';

const mockFetch = jest.fn();
const credentials = { username: 'test', password: 'test-password' };
const connectionError = Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
const response = (status: number) => ({
	ok: status === 200,
	status,
	json: () => Promise.resolve({ data: { userId: 'user', authToken: 'token' } }),
	text: () => Promise.resolve('unavailable')
});

describe('API retry budgets', () => {
	const originalFetch = global.fetch;
	beforeEach(() => {
		jest.useFakeTimers();
		mockFetch.mockReset();
		global.fetch = mockFetch;
	});
	afterEach(() => {
		global.fetch = originalFetch;
		jest.useRealTimers();
	});

	it('bounds GET response retries after connection recovery crosses five attempts', async () => {
		mockFetch.mockResolvedValueOnce(response(200));
		for (let index = 0; index < 6; index += 1) mockFetch.mockRejectedValueOnce(connectionError);
		mockFetch.mockResolvedValue(response(500));
		const result = get('users.info', credentials).catch(error => error);
		await jest.runAllTimersAsync();

		expect(await result).toMatchObject({ status: 500 });
		expect(mockFetch).toHaveBeenCalledTimes(12);
	});

	it('bounds rate-limit retries after connection recovery', async () => {
		for (let index = 0; index < 6; index += 1) mockFetch.mockRejectedValueOnce(connectionError);
		mockFetch.mockResolvedValue(response(429));
		const result = login(credentials).catch(error => error);
		await jest.runAllTimersAsync();

		expect(await result).toBeInstanceOf(Error);
		expect(mockFetch).toHaveBeenCalledTimes(11);
	});

	it('stops connection recovery at its deadline', async () => {
		mockFetch.mockRejectedValue(connectionError);
		const result = login(credentials).catch(error => error);
		await jest.runAllTimersAsync();

		expect(await result).toBe(connectionError);
		expect(mockFetch).toHaveBeenCalledTimes(19);
	});

	it('does not retry a POST server error', async () => {
		mockFetch.mockResolvedValue(response(500));
		await expect(login(credentials)).rejects.toMatchObject({ status: 500 });
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});

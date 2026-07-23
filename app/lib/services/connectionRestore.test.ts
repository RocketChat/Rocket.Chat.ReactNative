import { registerStreamRestorer, bindStreamRestoration } from './connectionRestore';

let mockGeneration = 1;
const mockOnStreamData = jest.fn<Promise<{ stop: jest.Mock }>, [string, () => void]>(() => Promise.resolve({ stop: jest.fn() }));
jest.mock('./sdk', () => ({
	__esModule: true,
	default: {
		get generation() {
			return mockGeneration;
		},
		onStreamData: (event: string, cb: () => void) => mockOnStreamData(event, cb)
	}
}));

const mockLog = jest.fn();
jest.mock('../methods/helpers/log', () => ({
	__esModule: true,
	default: (error: unknown) => mockLog(error)
}));

const flushMicrotasks = () => new Promise<void>(resolve => setImmediate(resolve));

describe('connectionRestore', () => {
	const disposers: (() => void)[] = [];

	beforeEach(() => {
		jest.clearAllMocks();
		mockGeneration = 1;
		disposers.length = 0;
	});

	afterEach(() => {
		disposers.forEach(dispose => dispose());
	});

	const bindAndGetFanout = async () => {
		await bindStreamRestoration();
		const lastCall = mockOnStreamData.mock.calls[mockOnStreamData.mock.calls.length - 1];
		expect(lastCall[0]).toBe('login');
		return lastCall[1];
	};

	it('runs every enrolled restorer when the login generation still matches', async () => {
		const first = jest.fn();
		const second = jest.fn();
		disposers.push(registerStreamRestorer(first), registerStreamRestorer(second));

		const fanout = await bindAndGetFanout();
		fanout();
		await flushMicrotasks();

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('disposer removes exactly its own restorer', async () => {
		const kept = jest.fn();
		const removed = jest.fn();
		const disposeRemoved = registerStreamRestorer(removed);
		disposers.push(registerStreamRestorer(kept));

		disposeRemoved();

		const fanout = await bindAndGetFanout();
		fanout();
		await flushMicrotasks();

		expect(removed).not.toHaveBeenCalled();
		expect(kept).toHaveBeenCalledTimes(1);
	});

	it('no-ops when the SDK generation advanced past the bound generation', async () => {
		const restorer = jest.fn();
		disposers.push(registerStreamRestorer(restorer));

		const fanout = await bindAndGetFanout();
		mockGeneration = 2;
		fanout();
		await flushMicrotasks();

		expect(restorer).not.toHaveBeenCalled();
	});

	it('logs a synchronously throwing restorer and still runs the others', async () => {
		const boom = jest.fn(() => {
			throw new Error('sync boom');
		});
		const ok = jest.fn();
		disposers.push(registerStreamRestorer(boom), registerStreamRestorer(ok));

		const fanout = await bindAndGetFanout();
		fanout();
		await flushMicrotasks();

		expect(ok).toHaveBeenCalledTimes(1);
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it('logs a rejecting restorer and still runs the others', async () => {
		const rejecting = jest.fn(() => Promise.reject(new Error('async boom')));
		const ok = jest.fn();
		disposers.push(registerStreamRestorer(rejecting), registerStreamRestorer(ok));

		const fanout = await bindAndGetFanout();
		fanout();
		await flushMicrotasks();

		expect(ok).toHaveBeenCalledTimes(1);
		expect(mockLog).toHaveBeenCalledTimes(1);
	});
});

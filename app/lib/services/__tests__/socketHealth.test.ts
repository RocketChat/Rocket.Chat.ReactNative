jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		current: { driver: undefined }
	}
}));

import sdk, { type TDriver } from '../sdk';
import { classifySocketHealth, recoverSocket } from '../socketHealth';

const now = 1_000_000;

const sdkMock = sdk as unknown as { current: { driver: unknown } | undefined };

interface MockDriver {
	connected: boolean;
	lastPing: number;
	pingInterval: number;
	reopenNow: jest.Mock<Promise<void>, []>;
	probe: jest.Mock<Promise<boolean>, [number]>;
}

function makeDriver(overrides: Partial<MockDriver> = {}): MockDriver {
	return {
		connected: true,
		lastPing: now,
		pingInterval: 10000,
		reopenNow: jest.fn<Promise<void>, []>(() => Promise.resolve()),
		probe: jest.fn<Promise<boolean>, [number]>(() => Promise.resolve(true)),
		...overrides
	};
}

describe('classifySocketHealth', () => {
	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(now);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns round-trip-check for a connected socket rather than trusting it outright', () => {
		const driver = makeDriver({ connected: true });
		expect(classifySocketHealth(driver as unknown as TDriver)).toBe('round-trip-check');
	});

	it('returns reopen for a closed socket even when lastPing is fresh', () => {
		const driver = makeDriver({ connected: false, lastPing: now });
		expect(classifySocketHealth(driver as unknown as TDriver)).toBe('reopen');
	});
});

describe('recoverSocket', () => {
	let driver: MockDriver;

	beforeEach(() => {
		driver = makeDriver({ lastPing: Date.now() });
		sdkMock.current = { driver };
	});

	it('keeps a socket whose round trip answers', async () => {
		await expect(recoverSocket()).resolves.toBe('confirmed-alive');
		expect(driver.reopenNow).not.toHaveBeenCalled();
	});

	it('runs the round trip with a 2s budget', async () => {
		await recoverSocket();
		expect(driver.probe).toHaveBeenCalledWith(2000);
	});

	it('reopens when the round trip goes unanswered', async () => {
		driver.probe.mockResolvedValue(false);
		await expect(recoverSocket()).resolves.toBe('reopened');
		expect(driver.reopenNow).toHaveBeenCalledTimes(1);
	});

	it('reopens a known-dead socket without a round trip', async () => {
		driver.connected = false;
		await expect(recoverSocket()).resolves.toBe('reopened');
		expect(driver.probe).not.toHaveBeenCalled();
		expect(driver.reopenNow).toHaveBeenCalledTimes(1);
	});

	it('reports no-socket when the driver handle is missing', async () => {
		sdkMock.current = { driver: undefined };
		await expect(recoverSocket()).resolves.toBe('no-socket');
		expect(driver.probe).not.toHaveBeenCalled();
		expect(driver.reopenNow).not.toHaveBeenCalled();
	});

	it('reports no-socket when there is no sdk instance', async () => {
		sdkMock.current = undefined;
		await expect(recoverSocket()).resolves.toBe('no-socket');
	});

	it('rejects when the round trip throws', async () => {
		driver.probe.mockRejectedValue(new Error('round trip failed'));
		await expect(recoverSocket()).rejects.toThrow('round trip failed');
	});

	it('rejects when reopening throws', async () => {
		driver.connected = false;
		driver.reopenNow.mockRejectedValue(new Error('reopen failed'));
		await expect(recoverSocket()).rejects.toThrow('reopen failed');
	});

	it('shares one in-flight recovery between overlapping callers', async () => {
		const outcomes = await Promise.all([recoverSocket(), recoverSocket()]);
		expect(outcomes).toEqual(['confirmed-alive', 'confirmed-alive']);
		expect(driver.probe).toHaveBeenCalledTimes(1);
	});

	it('starts a fresh recovery after the shared one settles', async () => {
		await recoverSocket();
		await recoverSocket();
		expect(driver.probe).toHaveBeenCalledTimes(2);
	});

	it('abandons the aborted caller while the shared recovery runs on', async () => {
		let answerRoundTrip: (alive: boolean) => void = () => {};
		driver.probe.mockImplementation(() => new Promise<boolean>(resolve => (answerRoundTrip = resolve)));

		const controller = new AbortController();
		const aborted = recoverSocket({ abortSignal: controller.signal });
		const other = recoverSocket();

		controller.abort();
		await expect(aborted).resolves.toBe('abandoned');

		answerRoundTrip(true);
		await expect(other).resolves.toBe('confirmed-alive');
		expect(driver.probe).toHaveBeenCalledTimes(1);
	});

	it('abandons a pre-aborted caller without touching the socket', async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(recoverSocket({ abortSignal: controller.signal })).resolves.toBe('abandoned');
		expect(driver.probe).not.toHaveBeenCalled();
		expect(driver.reopenNow).not.toHaveBeenCalled();
	});
});

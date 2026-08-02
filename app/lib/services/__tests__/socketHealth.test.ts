jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		current: { connection: undefined }
	}
}));

import sdk from '../sdk';
import { classifySocketHealth, recoverSocket } from '../socketHealth';

const now = 1_000_000;

const sdkMock = sdk as unknown as { current: { connection: unknown } | undefined };

interface MockConnection {
	status: 'connected' | 'disconnected';
	lastPing: number;
	reopenNow: jest.Mock<Promise<void>, []>;
	probe: jest.Mock<Promise<boolean>, [number]>;
}

function makeConnection(overrides: Partial<MockConnection> = {}): MockConnection {
	return {
		status: 'connected',
		lastPing: now,
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

	it('returns reopen when age > 20s (2x the old-SDK 10s ping default)', () => {
		const connection = makeConnection({ lastPing: now - 21000 });
		expect(classifySocketHealth(connection)).toBe('reopen');
	});

	it('returns round-trip-check when age <= 20s', () => {
		const connection = makeConnection({ lastPing: now - 15000 });
		expect(classifySocketHealth(connection)).toBe('round-trip-check');
	});

	it('returns round-trip-check for a young ping rather than trusting it outright', () => {
		const connection = makeConnection({ lastPing: now - 5000 });
		expect(classifySocketHealth(connection)).toBe('round-trip-check');
	});

	it('returns reopen for a non-connected socket even when lastPing is fresh', () => {
		const connection = makeConnection({ status: 'disconnected', lastPing: now });
		expect(classifySocketHealth(connection)).toBe('reopen');
	});
});

describe('recoverSocket', () => {
	let connection: MockConnection;

	beforeEach(() => {
		connection = makeConnection({ lastPing: Date.now() });
		sdkMock.current = { connection };
	});

	it('keeps a socket whose round trip answers', async () => {
		await expect(recoverSocket()).resolves.toBe('confirmed-alive');
		expect(connection.reopenNow).not.toHaveBeenCalled();
	});

	it('runs the round trip with a 2s budget', async () => {
		await recoverSocket();
		expect(connection.probe).toHaveBeenCalledWith(2000);
	});

	it('reopens when the round trip goes unanswered', async () => {
		connection.probe.mockResolvedValue(false);
		await expect(recoverSocket()).resolves.toBe('reopened');
		expect(connection.reopenNow).toHaveBeenCalledTimes(1);
	});

	it('reopens a known-dead socket without a round trip', async () => {
		connection.status = 'disconnected';
		await expect(recoverSocket()).resolves.toBe('reopened');
		expect(connection.probe).not.toHaveBeenCalled();
		expect(connection.reopenNow).toHaveBeenCalledTimes(1);
	});

	it('reports no-socket when the connection handle is missing', async () => {
		sdkMock.current = { connection: undefined };
		await expect(recoverSocket()).resolves.toBe('no-socket');
		expect(connection.probe).not.toHaveBeenCalled();
		expect(connection.reopenNow).not.toHaveBeenCalled();
	});

	it('reports no-socket when there is no sdk instance', async () => {
		sdkMock.current = undefined;
		await expect(recoverSocket()).resolves.toBe('no-socket');
	});

	it('rejects when the round trip throws', async () => {
		connection.probe.mockRejectedValue(new Error('round trip failed'));
		await expect(recoverSocket()).rejects.toThrow('round trip failed');
	});

	it('rejects when reopening throws', async () => {
		connection.status = 'disconnected';
		connection.reopenNow.mockRejectedValue(new Error('reopen failed'));
		await expect(recoverSocket()).rejects.toThrow('reopen failed');
	});

	it('shares one in-flight recovery between overlapping callers', async () => {
		const outcomes = await Promise.all([recoverSocket(), recoverSocket()]);
		expect(outcomes).toEqual(['confirmed-alive', 'confirmed-alive']);
		expect(connection.probe).toHaveBeenCalledTimes(1);
	});

	it('starts a fresh recovery after the shared one settles', async () => {
		await recoverSocket();
		await recoverSocket();
		expect(connection.probe).toHaveBeenCalledTimes(2);
	});

	it('abandons the aborted caller while the shared recovery runs on', async () => {
		let answerRoundTrip: (alive: boolean) => void = () => {};
		connection.probe.mockImplementation(() => new Promise<boolean>(resolve => (answerRoundTrip = resolve)));

		const controller = new AbortController();
		const aborted = recoverSocket({ abortSignal: controller.signal });
		const other = recoverSocket();

		controller.abort();
		await expect(aborted).resolves.toBe('abandoned');

		answerRoundTrip(true);
		await expect(other).resolves.toBe('confirmed-alive');
		expect(connection.probe).toHaveBeenCalledTimes(1);
	});

	it('abandons a pre-aborted caller without touching the socket', async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(recoverSocket({ abortSignal: controller.signal })).resolves.toBe('abandoned');
		expect(connection.probe).not.toHaveBeenCalled();
		expect(connection.reopenNow).not.toHaveBeenCalled();
	});
});

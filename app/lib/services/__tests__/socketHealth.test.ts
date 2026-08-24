import sdk, { type ISocketDriver } from '../sdk';
import { classifySocketHealth, recoverSocket } from '../socketHealth';
import { buildConnectedDriver } from '../../testUtils/sdkIntegration';
import type { IMockSdk, ISdkDriver, MockConnection } from '../../testUtils/sdkIntegration';
import type * as SdkIntegration from '../../testUtils/sdkIntegration';

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('../sdk', () => {
	const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../testUtils/sdkIntegration');
	return { __esModule: true, default: sdkIntegration.makeSdkMock() };
});

const sdkMock = sdk as unknown as IMockSdk;

const USER_ID = 'user-id';
const CLOSED = 3;

describe('socket health against a driver from the shared harness', () => {
	let driver: ISdkDriver;
	let probe: jest.SpyInstance<Promise<boolean>, [number?]>;
	let reopenNow: jest.SpyInstance<Promise<void>, []>;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockConnections.length = 0;
		driver = await buildConnectedDriver(mockConnections, USER_ID);
		probe = jest.spyOn(driver, 'probe').mockResolvedValue(true);
		reopenNow = jest.spyOn(driver, 'reopenNow').mockResolvedValue();
		sdkMock.setClient({ driver });
	});

	afterEach(() => {
		if (driver.socket.pingTimeout) clearTimeout(driver.socket.pingTimeout);
		if (driver.socket.openTimeout) clearTimeout(driver.socket.openTimeout);
		jest.useRealTimers();
	});

	describe('classifySocketHealth', () => {
		it('returns round-trip-check for a connected socket rather than trusting it outright', () => {
			expect(classifySocketHealth(driver as unknown as ISocketDriver)).toBe('round-trip-check');
		});

		it('returns reopen for a closed socket even when lastPing is fresh', () => {
			mockConnections[0].readyState = CLOSED;
			expect(classifySocketHealth(driver as unknown as ISocketDriver)).toBe('reopen');
		});
	});

	describe('recoverSocket', () => {
		it('keeps a socket whose round trip answers', async () => {
			await expect(recoverSocket()).resolves.toBe('confirmed-alive');
			expect(reopenNow).not.toHaveBeenCalled();
		});

		it('runs the round trip with a 2s budget', async () => {
			await recoverSocket();
			expect(probe).toHaveBeenCalledWith(2000);
		});

		it('reopens when the round trip goes unanswered', async () => {
			probe.mockResolvedValue(false);
			await expect(recoverSocket()).resolves.toBe('reopened');
			expect(reopenNow).toHaveBeenCalledTimes(1);
		});

		it('reopens a known-dead socket without a round trip', async () => {
			mockConnections[0].readyState = CLOSED;
			await expect(recoverSocket()).resolves.toBe('reopened');
			expect(probe).not.toHaveBeenCalled();
			expect(reopenNow).toHaveBeenCalledTimes(1);
		});

		it('reports no-socket when the driver handle is missing', async () => {
			sdkMock.setClient({});
			await expect(recoverSocket()).resolves.toBe('no-socket');
			expect(probe).not.toHaveBeenCalled();
			expect(reopenNow).not.toHaveBeenCalled();
		});

		it('reports no-socket when there is no client at all', async () => {
			sdkMock.setClient(null);
			await expect(recoverSocket()).resolves.toBe('no-socket');
			expect(probe).not.toHaveBeenCalled();
			expect(reopenNow).not.toHaveBeenCalled();
		});

		it('rejects when the round trip throws', async () => {
			probe.mockRejectedValue(new Error('round trip failed'));
			await expect(recoverSocket()).rejects.toThrow('round trip failed');
		});

		it('rejects when reopening throws', async () => {
			mockConnections[0].readyState = CLOSED;
			reopenNow.mockRejectedValue(new Error('reopen failed'));
			await expect(recoverSocket()).rejects.toThrow('reopen failed');
		});

		it('shares one in-flight recovery between overlapping callers', async () => {
			const outcomes = await Promise.all([recoverSocket(), recoverSocket()]);
			expect(outcomes).toEqual(['confirmed-alive', 'confirmed-alive']);
			expect(probe).toHaveBeenCalledTimes(1);
		});

		it('starts a fresh recovery after the shared one settles', async () => {
			await recoverSocket();
			await recoverSocket();
			expect(probe).toHaveBeenCalledTimes(2);
		});

		it('abandons the aborted caller while the shared recovery runs on', async () => {
			let answerRoundTrip: (alive: boolean) => void = () => {};
			probe.mockImplementation(() => new Promise<boolean>(resolve => (answerRoundTrip = resolve)));

			const controller = new AbortController();
			const aborted = recoverSocket({ abortSignal: controller.signal });
			const other = recoverSocket();

			controller.abort();
			await expect(aborted).resolves.toBe('abandoned');

			answerRoundTrip(true);
			await expect(other).resolves.toBe('confirmed-alive');
			expect(probe).toHaveBeenCalledTimes(1);
		});

		it('abandons a pre-aborted caller without touching the socket', async () => {
			const controller = new AbortController();
			controller.abort();

			await expect(recoverSocket({ abortSignal: controller.signal })).resolves.toBe('abandoned');
			expect(probe).not.toHaveBeenCalled();
			expect(reopenNow).not.toHaveBeenCalled();
		});
	});
});

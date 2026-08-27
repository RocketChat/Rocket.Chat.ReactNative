import sdk, { type ISocketDriver } from '../sdk';
import { classifySocketHealth, recoverSocket } from '../socketHealth';
import { connectAuthenticatedSdk, createTransportFake } from '../../testUtils/sdkTransport';
import type { RealSdkClient } from '../../testUtils/sdkTransport';
import type * as SdkModuleFake from '../../testUtils/sdkModuleFake';

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

jest.mock('../sdk', () => {
	const { createSdkModuleFake } = jest.requireActual<typeof SdkModuleFake>('../../testUtils/sdkModuleFake');
	return { __esModule: true, default: createSdkModuleFake() };
});

const sdkMock = sdk as unknown as SdkModuleFake.ISdkModuleFake;

describe('socket health over the public SDK driver', () => {
	let client: RealSdkClient;
	let driver: ISocketDriver;
	let probe: jest.SpyInstance<Promise<boolean>, [number?]>;
	let reopenNow: jest.SpyInstance<Promise<void>, []>;

	beforeEach(async () => {
		jest.clearAllMocks();
		mockTransport.reset();
		client = await connectAuthenticatedSdk(mockTransport);
		driver = client.driver;
		probe = jest.spyOn(driver, 'probe').mockResolvedValue(true);
		reopenNow = jest.spyOn(driver, 'reopenNow').mockResolvedValue();
		sdkMock.setClient({ driver });
	});

	afterEach(async () => {
		reopenNow.mockRestore();
		probe.mockRestore();
		await client.disconnect();
	});

	describe('classifySocketHealth', () => {
		it('returns round-trip-check for a connected socket rather than trusting it outright', () => {
			expect(classifySocketHealth(driver)).toBe('round-trip-check');
		});

		it('returns reopen once the transport is closed', () => {
			mockTransport.closeTransport();
			expect(classifySocketHealth(driver)).toBe('reopen');
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
			mockTransport.closeTransport();
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
			mockTransport.closeTransport();
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

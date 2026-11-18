import sdk from '../sdk';
import { recoverSocket } from '../socketHealth';
import {
	addMediaSubs,
	backdateLastPing,
	buildConnectedDriver,
	framesOn,
	resumeLogin,
	stopAnsweringFrames
} from '~/lib/testUtils/sdkIntegration';
import type { IMockSdk, MockConnection, IMockSdkDriver } from '~/lib/testUtils/sdkIntegration';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('../sdk', () => {
	const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
	return { __esModule: true, default: sdkIntegration.makeSdkMock() };
});

const USER_ID = 'user-id';
const PING_INTERVAL = 10000;
const CLOSED = 3;

describe('recoverSocket against the real SDK socket', () => {
	let driver: IMockSdkDriver;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockConnections.length = 0;
		driver = await buildConnectedDriver(mockConnections, USER_ID);
		(sdk as unknown as IMockSdk).setClient({ driver });
	});

	afterEach(() => {
		if (driver.socket.pingTimeout) clearTimeout(driver.socket.pingTimeout);
		if (driver.socket.openTimeout) clearTimeout(driver.socket.openTimeout);
		jest.useRealTimers();
	});

	it('keeps a doubtful socket when the round trip gets a pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('confirmed-alive');
		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(1);
	});

	it('reopens a doubtful socket when the round trip gets no pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);
		stopAnsweringFrames(mockConnections[0]);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(2000);

		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('reopens a frozen socket whose young lastPing sits on an unusable session', async () => {
		stopAnsweringFrames(mockConnections[0]);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(2000);

		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('reopens a known-dead socket without a round trip', async () => {
		backdateLastPing(driver, PING_INTERVAL * 2 + 1000);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockConnections).toHaveLength(2);
		expect(framesOn(mockConnections[0], 'ping')).toHaveLength(0);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('shares one reopen with a concurrent direct reopenNow', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);

		const directReopen = driver.reopenNow();
		const recovery = recoverSocket();

		await jest.advanceTimersByTimeAsync(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await directReopen;
		await expect(recovery).resolves.toBe('reopened');
		expect(mockConnections).toHaveLength(2);

		await jest.advanceTimersByTimeAsync(60000);
		expect(mockConnections).toHaveLength(2);
	});

	it('rejects an in-flight DDP method call when recovery reopens the socket', async () => {
		let rejected = false;
		const inFlight = driver.socket.send({ msg: 'method', method: 'getRoomByTypeAndName', params: [] }).catch(() => {
			rejected = true;
		});
		await jest.advanceTimersByTimeAsync(0);
		expect(rejected).toBe(false);

		backdateLastPing(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		await inFlight;
		expect(rejected).toBe(true);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('resolves at once on a live socket whose media subs were acked, sending no sub', async () => {
		await addMediaSubs(driver, USER_ID);
		const subsBefore = framesOn(mockConnections[0], 'sub').length;

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		await expect(recovery).resolves.toBe('confirmed-alive');

		await expect(driver.waitForNotifyUserMediaSubs()).resolves.toBe(true);
		expect(framesOn(mockConnections[0], 'sub')).toHaveLength(subsBefore);
	});

	it('waits for the resume login to resubscribe the media subs on the reopened socket, sending none itself', async () => {
		await addMediaSubs(driver, USER_ID);
		const mediaSubIds = framesOn(mockConnections[0], 'sub').map(frame => frame.id);
		backdateLastPing(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);
		await expect(recovery).resolves.toBe('reopened');

		const resubscribed = driver.waitForNotifyUserMediaSubs();
		let resolved: boolean | undefined;
		resubscribed.then(value => {
			resolved = value;
		});
		await jest.advanceTimersByTimeAsync(200);
		expect(resolved).toBeUndefined();
		expect(framesOn(mockConnections[1], 'sub')).toHaveLength(0);

		await resumeLogin(driver);
		await jest.advanceTimersByTimeAsync(200);

		await expect(resubscribed).resolves.toBe(true);
		expect(framesOn(mockConnections[1], 'sub').map(frame => frame.id)).toEqual(mediaSubIds);
	});

	it('reopens a closed transport without a round trip even when lastPing is fresh', async () => {
		mockConnections[0].readyState = CLOSED;

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockConnections).toHaveLength(2);
		expect(framesOn(mockConnections[0], 'ping')).toHaveLength(0);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('resolves once media subs subscribed after the reopen are acked, without re-sending them', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);
		await expect(recovery).resolves.toBe('reopened');

		const resubscribed = driver.waitForNotifyUserMediaSubs(1000);
		await jest.advanceTimersByTimeAsync(100);
		expect(framesOn(mockConnections[1], 'sub')).toHaveLength(0);

		await addMediaSubs(driver, USER_ID);
		await jest.advanceTimersByTimeAsync(200);

		await expect(resubscribed).resolves.toBe(true);
		expect(framesOn(mockConnections[1], 'sub')).toEqual([
			expect.objectContaining({ name: 'stream-notify-user', params: [`${USER_ID}/media-signal`] }),
			expect.objectContaining({ name: 'stream-notify-user', params: [`${USER_ID}/media-calls`] })
		]);
	});

	it('resolves false when the reopened socket never acks the resubscribe', async () => {
		await addMediaSubs(driver, USER_ID);
		backdateLastPing(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);
		await expect(recovery).resolves.toBe('reopened');

		stopAnsweringFrames(mockConnections[1]);
		driver.socket.login({ resume: 'auth-token' }).catch(() => undefined);

		const resubscribed = driver.waitForNotifyUserMediaSubs(500);
		await jest.advanceTimersByTimeAsync(500);

		await expect(resubscribed).resolves.toBe(false);
	});

	it('shares one reopen between two concurrent recoverSocket calls', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);

		const first = recoverSocket();
		const second = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(first).resolves.toBe('reopened');
		await expect(second).resolves.toBe('reopened');
		expect(mockConnections).toHaveLength(2);
	});
});

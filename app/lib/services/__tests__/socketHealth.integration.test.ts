import sdk, { type ISocketDriver } from '../sdk';
import { recoverSocket } from '../socketHealth';
import { connectAuthenticatedSdk, createTransportFake } from '../../testUtils/sdkTransport';
import type { FakeConnection, RealSdkClient } from '../../testUtils/sdkTransport';
import type * as SdkModuleFake from '../../testUtils/sdkModuleFake';

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

jest.mock('../sdk', () => {
	const { createSdkModuleFake } = jest.requireActual<typeof SdkModuleFake>('../../testUtils/sdkModuleFake');
	return { __esModule: true, default: createSdkModuleFake() };
});

const USER_ID = 'user-id';
const ROUND_TRIP_BUDGET = 2000;
const RESUBSCRIBE_POLL = 100;
const CLOSED = 3;

const MEDIA_SUBS = [
	{ id: expect.any(String), name: 'stream-notify-user', params: [`${USER_ID}/media-signal`, false] },
	{ id: expect.any(String), name: 'stream-notify-user', params: [`${USER_ID}/media-calls`, false] }
];

describe('recoverSocket over the public SDK driver and an app-owned transport', () => {
	let client: RealSdkClient;
	let driver: ISocketDriver;
	let frozen: FakeConnection;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockTransport.reset();
		client = await connectAuthenticatedSdk(mockTransport);
		driver = client.driver;
		frozen = mockTransport.latestConnection;
		(sdk as unknown as SdkModuleFake.ISdkModuleFake).setClient({ driver });
	});

	afterEach(async () => {
		await client.disconnect();
		jest.useRealTimers();
	});

	async function subscribeToMediaStreams(): Promise<void> {
		await Promise.all([
			client.subscribeRaw('stream-notify-user', [`${USER_ID}/media-signal`, false]),
			client.subscribeRaw('stream-notify-user', [`${USER_ID}/media-calls`, false])
		]);
	}

	async function reopenAfterUnansweredRoundTrip(): Promise<{ recovery: Promise<string>; reopened: FakeConnection }> {
		mockTransport.withhold({ msg: 'ping' });
		const recovery = recoverSocket();
		await mockTransport.awaitFrame({ msg: 'ping' }, frozen);
		await jest.advanceTimersByTimeAsync(ROUND_TRIP_BUDGET);
		const reopened = await mockTransport.awaitConnection(1);
		mockTransport.open(reopened);
		return { recovery, reopened };
	}

	it('keeps a live socket when the round trip gets a pong', async () => {
		await expect(recoverSocket()).resolves.toBe('confirmed-alive');

		expect(mockTransport.frames({ msg: 'ping' }, frozen).length).toBeGreaterThan(0);
		expect(mockTransport.connections).toHaveLength(1);
	});

	it('reopens a frozen socket when the round trip gets no pong', async () => {
		const { recovery } = await reopenAfterUnansweredRoundTrip();

		expect(mockTransport.frames({ msg: 'ping' }, frozen).length).toBeGreaterThan(0);
		expect(mockTransport.connections).toHaveLength(2);
		await expect(recovery).resolves.toBe('reopened');
	});

	it('reopens a closed transport without a round trip', async () => {
		mockTransport.closeTransport(frozen);
		const pingsBefore = mockTransport.frames({ msg: 'ping' }, frozen).length;

		const recovery = recoverSocket();
		const reopened = await mockTransport.awaitConnection(1);
		mockTransport.open(reopened);

		await expect(recovery).resolves.toBe('reopened');
		expect(mockTransport.frames({ msg: 'ping' }, frozen)).toHaveLength(pingsBefore);
		expect(frozen.readyState).toBe(CLOSED);
	});

	it('shares one reopen with a concurrent direct reopenNow', async () => {
		mockTransport.closeTransport(frozen);

		const directReopen = driver.reopenNow();
		const recovery = recoverSocket();

		mockTransport.open(await mockTransport.awaitConnection(1));

		await directReopen;
		await expect(recovery).resolves.toBe('reopened');
		expect(mockTransport.connections).toHaveLength(2);

		await jest.advanceTimersByTimeAsync(60000);
		expect(mockTransport.connections).toHaveLength(2);
	});

	it('shares one reopen between two concurrent recoverSocket calls', async () => {
		mockTransport.closeTransport(frozen);

		const first = recoverSocket();
		const second = recoverSocket();

		mockTransport.open(await mockTransport.awaitConnection(1));

		await expect(first).resolves.toBe('reopened');
		await expect(second).resolves.toBe('reopened');
		expect(mockTransport.connections).toHaveLength(2);
	});

	it('rejects an in-flight method call when recovery reopens the socket', async () => {
		mockTransport.withhold({ msg: 'method', method: 'getRoomByTypeAndName' });
		let rejection: Error | undefined;
		const inFlight = client.methodCall('getRoomByTypeAndName', 'general').catch((error: Error) => {
			rejection = error;
		});
		await mockTransport.awaitFrame({ msg: 'method', method: 'getRoomByTypeAndName' }, frozen);

		const { recovery } = await reopenAfterUnansweredRoundTrip();

		await inFlight;
		expect(rejection?.message).toBe('[ddp] connection reopened before the response arrived');
		await expect(recovery).resolves.toBe('reopened');
	});

	it('re-sends the media subscriptions on the reopened socket reusing their ids', async () => {
		await subscribeToMediaStreams();
		const establishedSubs = mockTransport.frames({ msg: 'sub' }, frozen);

		const { recovery, reopened } = await reopenAfterUnansweredRoundTrip();
		await expect(recovery).resolves.toBe('reopened');

		const resubscribed = driver.waitForNotifyUserMediaSubs();
		await jest.advanceTimersByTimeAsync(RESUBSCRIBE_POLL);
		await expect(resubscribed).resolves.toBe(true);

		expect(mockTransport.frames({ msg: 'sub' }, reopened)).toEqual(
			establishedSubs.map(sub => expect.objectContaining({ id: sub.id, name: sub.name, params: sub.params }))
		);
	});

	it('waits for media subs to appear after the reopen, then re-acks them', async () => {
		const { recovery, reopened } = await reopenAfterUnansweredRoundTrip();
		await expect(recovery).resolves.toBe('reopened');

		const resubscribed = driver.waitForNotifyUserMediaSubs(1000);
		await jest.advanceTimersByTimeAsync(RESUBSCRIBE_POLL);
		expect(mockTransport.frames({ msg: 'sub' }, reopened)).toHaveLength(0);

		await subscribeToMediaStreams();
		const establishedSubs = mockTransport.frames({ msg: 'sub' }, reopened);
		expect(establishedSubs).toEqual(MEDIA_SUBS.map(sub => expect.objectContaining(sub)));
		await jest.advanceTimersByTimeAsync(RESUBSCRIBE_POLL);

		await expect(resubscribed).resolves.toBe(true);
		expect(mockTransport.frames({ msg: 'sub' }, reopened)).toEqual([
			...establishedSubs,
			...establishedSubs.map(sub => expect.objectContaining({ id: sub.id, params: sub.params }))
		]);
	});

	it('resolves false when the reopened socket never acks the re-sub', async () => {
		await subscribeToMediaStreams();

		const { recovery } = await reopenAfterUnansweredRoundTrip();
		await expect(recovery).resolves.toBe('reopened');

		mockTransport.withhold({ msg: 'sub' });

		const resubscribed = driver.waitForNotifyUserMediaSubs(500);
		await jest.advanceTimersByTimeAsync(500);

		await expect(resubscribed).resolves.toBe(false);
	});
});

import { connectAuthenticatedSdk, createTransportFake } from '../../testUtils/sdkTransport';
import type { RealSdkClient } from '../../testUtils/sdkTransport';

const mockTransport = createTransportFake();

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

let client: RealSdkClient;

beforeEach(() => {
	jest.clearAllMocks();
	mockTransport.reset();
});

afterEach(async () => {
	await client?.disconnect();
});

describe('SDK transport fake', () => {
	it('reaches connected and authenticated state through public connect and login', async () => {
		client = await connectAuthenticatedSdk(mockTransport, { token: 'resume-token' });

		expect(client.driver.connected).toBe(true);
		expect(client.userId).toBe('user-id');
		expect(mockTransport.requireFrame({ msg: 'method', method: 'login' }).params).toEqual([{ resume: 'resume-token' }]);
	});

	it('completes a public method call when its server frame is delivered', async () => {
		client = await connectAuthenticatedSdk(mockTransport);

		const pending = client.methodCall('getRoomIdByNameOrId', 'general');
		const request = await mockTransport.awaitFrame({ msg: 'method', method: 'getRoomIdByNameOrId' });
		mockTransport.respond(request, 'room-id');

		await expect(pending).resolves.toBe('room-id');
	});

	it('records subscription frames sent through a public subscribe operation', async () => {
		client = await connectAuthenticatedSdk(mockTransport);

		const subscription = await client.subscribeRaw('stream-notify-user', ['user-id/media-signal', false]);
		const request = await mockTransport.awaitFrame({ msg: 'sub', name: 'stream-notify-user' });

		expect(subscription?.id).toBe(request.id);
		expect(request.params).toEqual(['user-id/media-signal', false]);
	});

	it('keeps an operation pending while its response is withheld', async () => {
		client = await connectAuthenticatedSdk(mockTransport);
		mockTransport.withhold({ msg: 'sub' });

		let settled = false;
		const pending = client.subscribeRaw('stream-notify-user', ['user-id/media-calls', false]).then(subscription => {
			settled = true;
			return subscription;
		});
		const request = await mockTransport.awaitFrame({ msg: 'sub' });
		await Promise.resolve();

		expect(settled).toBe(false);

		mockTransport.deliver({ msg: 'ready', subs: [request.id] });

		await expect(pending).resolves.toEqual(expect.objectContaining({ id: request.id }));
	});

	it('rejects an in-flight public method call when recovery replaces the transport', async () => {
		client = await connectAuthenticatedSdk(mockTransport);

		const pending = client.methodCall('getUsersOfRoom', 'room-id');
		await mockTransport.awaitFrame({ msg: 'method', method: 'getUsersOfRoom' });

		const recovering = client.driver.reopenNow();

		await expect(pending).rejects.toThrow('[ddp] connection reopened before the response arrived');

		mockTransport.open(await mockTransport.awaitConnection(1));
		await recovering;
	});

	it('closes the transport through a public disconnect operation', async () => {
		client = await connectAuthenticatedSdk(mockTransport);
		const connection = mockTransport.latestConnection;

		await client.disconnect();

		expect(connection.readyState).toBe(3);
		expect(client.driver.connected).toBe(false);
	});
});

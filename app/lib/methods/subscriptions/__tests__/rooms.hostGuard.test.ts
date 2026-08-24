jest.mock('../../../services/sdk', () => ({
	__esModule: true,
	default: {
		host: null,
		hasClient: false,
		onStreamData: jest.fn(async () => ({ stop: jest.fn() })),
		subscribeNotifyUser: jest.fn(async () => undefined)
	}
}));

jest.mock('../../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn(), batch: jest.fn() } }
}));

jest.mock('../../../store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn(() => ({ settings: {}, login: { user: {} } })) }
}));

jest.mock('../../helpers/log', () => ({ __esModule: true, default: jest.fn() }));

import subscribeRooms, { roomsSubscription } from '../rooms';
import sdk from '../../../services/sdk';
import database from '../../../database';
import type { IDDPMessage } from '../../../../definitions/IDDPMessage';

const mockedSdk = sdk as unknown as {
	host: string | null;
	hasClient: boolean;
	onStreamData: jest.Mock;
	subscribeNotifyUser: jest.Mock;
};
const mockedDatabase = database as unknown as { active: { get: jest.Mock } };

const HOST = 'https://open.rocket.chat';

const removedSubscriptionFrame = (): IDDPMessage =>
	({
		msg: 'changed',
		collection: 'stream-notify-user',
		id: 'id',
		fields: {
			eventName: 'userId/subscriptions-changed',
			args: ['removed', { rid: 'rid' }]
		}
	}) as unknown as IDDPMessage;

describe('subscribeRooms host guard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedSdk.host = null;
		mockedSdk.hasClient = false;
	});

	it('does not open the stream when there is no client', () => {
		subscribeRooms();

		expect(mockedSdk.onStreamData).not.toHaveBeenCalled();
		expect(mockedSdk.subscribeNotifyUser).not.toHaveBeenCalled();
	});

	it('drops a frame that arrives after the client is gone', async () => {
		mockedSdk.host = HOST;
		mockedSdk.hasClient = true;
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockedSdk.onStreamData.mock.calls[0];
		mockedSdk.host = null;
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).not.toHaveBeenCalled();
	});

	it('drops a frame that arrives after the subscription stopped', async () => {
		mockedSdk.host = HOST;
		mockedSdk.hasClient = true;
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockedSdk.onStreamData.mock.calls[0];
		roomsSubscription?.stop();
		mockedSdk.host = null;
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).not.toHaveBeenCalled();
	});

	it('processes a frame whose host matches the subscribed server', async () => {
		mockedSdk.host = HOST;
		mockedSdk.hasClient = true;
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockedSdk.onStreamData.mock.calls[0];
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).toHaveBeenCalledWith('subscriptions');
	});
});

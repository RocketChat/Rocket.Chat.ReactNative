const mockOnStreamData = jest.fn(async (_event: string, _callback: (message: IDDPMessage) => void) => ({ stop: jest.fn() }));
const mockSubscribeNotifyUser = jest.fn(async () => undefined);

jest.mock('../../../services/sdk', () => {
	const { createSdkModuleFake } = jest.requireActual<typeof SdkModuleFake>('../../../testUtils/sdkModuleFake');
	return {
		__esModule: true,
		default: createSdkModuleFake({
			onStreamData: (...args: Parameters<typeof mockOnStreamData>) => mockOnStreamData(...args),
			subscribeNotifyUser: () => mockSubscribeNotifyUser()
		})
	};
});

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
import type * as SdkModuleFake from '../../../testUtils/sdkModuleFake';

const mockedSdk = sdk as unknown as SdkModuleFake.ISdkModuleFake;
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
		mockedSdk.setClient(null);
	});

	it('does not open the stream when there is no client', () => {
		subscribeRooms();

		expect(mockOnStreamData).not.toHaveBeenCalled();
		expect(mockSubscribeNotifyUser).not.toHaveBeenCalled();
	});

	it('drops a frame that arrives after the client is gone', async () => {
		mockedSdk.setClient({ host: HOST });
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockOnStreamData.mock.calls[0];
		mockedSdk.setClient(null);
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).not.toHaveBeenCalled();
	});

	it('drops a frame that arrives after the subscription stopped', async () => {
		mockedSdk.setClient({ host: HOST });
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockOnStreamData.mock.calls[0];
		roomsSubscription?.stop();
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).not.toHaveBeenCalled();
	});

	it('processes a frame whose host matches the subscribed server', async () => {
		mockedSdk.setClient({ host: HOST });
		subscribeRooms();

		const [, handleStreamMessageReceived] = mockOnStreamData.mock.calls[0];
		await handleStreamMessageReceived(removedSubscriptionFrame());

		expect(mockedDatabase.active.get).toHaveBeenCalledWith('subscriptions');
	});
});

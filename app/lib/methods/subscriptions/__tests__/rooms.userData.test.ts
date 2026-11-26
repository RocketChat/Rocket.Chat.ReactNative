const mockOnStreamData = jest.fn(async (_event: string, _callback: (message: IDDPMessage) => void) => ({ stop: jest.fn() }));
const mockSubscribeNotifyUser = jest.fn(async () => []);

jest.mock('~/lib/services/sdk', () => {
	const { makeSdkMock } = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
	return {
		__esModule: true,
		default: makeSdkMock({
			onStreamData: (...args: Parameters<typeof mockOnStreamData>) => mockOnStreamData(...args),
			subscribeNotifyUser: () => mockSubscribeNotifyUser()
		})
	};
});

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn(), batch: jest.fn() } }
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn(() => ({ settings: {}, login: { user: {} } })) }
}));

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

import subscribeRooms from '../rooms';
import { setPreference } from '~/actions/login';
import { store } from '~/lib/store/auxStore';
import sdk from '~/lib/services/sdk';
import type { IDDPMessage } from '~/definitions/IDDPMessage';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';

const mockedSdk = sdk as unknown as SdkIntegration.IMockSdk;

const HOST = 'https://open.rocket.chat';

const userDataFrame = (change: { diff?: object; unset?: object }): IDDPMessage =>
	({
		msg: 'changed',
		collection: 'stream-notify-user',
		id: 'id',
		fields: { eventName: 'userId/userData', args: [{ type: 'updated', ...change }] }
	}) as unknown as IDDPMessage;

const receive = async (frame: IDDPMessage) => {
	mockedSdk.setClient({ host: HOST });
	subscribeRooms();
	const [, handleStreamMessageReceived] = mockOnStreamData.mock.calls[0];
	await handleStreamMessageReceived(frame);
};

describe('subscribeRooms user data', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('stores a sections order changed on another device', async () => {
		await receive(userDataFrame({ diff: { 'settings.preferences.sidebarSectionsOrder': ['Conversations', 'Favorites'] } }));

		expect(store.dispatch).toHaveBeenCalledWith(setPreference({ sidebarSectionsOrder: ['Conversations', 'Favorites'] }));
	});

	it('clears the sections order when the server unsets it', async () => {
		await receive(userDataFrame({ unset: { 'settings.preferences.sidebarSectionsOrder': 1 } }));

		expect(store.dispatch).toHaveBeenCalledWith(setPreference({ sidebarSectionsOrder: undefined }));
	});
});

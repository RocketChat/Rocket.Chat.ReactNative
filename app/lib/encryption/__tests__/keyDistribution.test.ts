import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { waitFor } from '@testing-library/react-native';

import Encryption from '../encryption';
import { fetchUsersWaitingForGroupKey } from '../../services/restApi';
import { type TAppDatabase } from '../../database/interfaces';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';
import roomKeys from './fixtures/roomKeys.json';
import user from './fixtures/user.json';

let mockDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('../../services/restApi', () => ({
	...jest.requireActual('../../services/restApi'),
	fetchUsersWaitingForGroupKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn(),
	e2eRequestRoomKey: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: () => ({ server: { version: '7.13.0' }, settings: {}, encryption: { enabled: true, banner: '' } }) }
}));

const SERVER = 'https://open.rocket.chat';
const WAITING_USER_ID = 'waiting-user';

const flushPromises = async () => {
	for (let i = 0; i < 10; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
};

const seedRoomWithWaitingUser = (rid: string) =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: rid }, subscriptions.schema);
			subscription.rid = rid;
			subscription.encrypted = true;
			subscription.E2EKey = roomKeys.v2.E2EKey;
			subscription.e2eKeyId = roomKeys.v2.keyID;
			subscription.usersWaitingForE2EKeys = [{ userId: WAITING_USER_ID, ts: new Date() }];
		});
	});

const signIn = async () => {
	await Encryption.persistKeys(SERVER, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
};

beforeEach(async () => {
	jest.clearAllMocks();
	mockDatabase = createInMemoryAppDatabase();
	await seedRoomWithWaitingUser('room-id');
	jest.mocked(fetchUsersWaitingForGroupKey).mockResolvedValue({ success: true, usersWaitingForE2EKeys: {} } as any);
});

afterEach(async () => {
	Encryption.stop();
	await flushPromises();
});

describe('key distribution across sign-ins', () => {
	it('distributes room keys right away when the user signs in again after a stop', async () => {
		await signIn();
		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(1));

		Encryption.stop();
		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(2));
	});

	it('ends the loop when the client stops during the first distribution', async () => {
		jest.mocked(fetchUsersWaitingForGroupKey).mockImplementationOnce(async () => {
			Encryption.stop();
			return { success: true, usersWaitingForE2EKeys: {} } as any;
		});
		await signIn();
		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(1));
		await flushPromises();

		await signIn();

		await waitFor(() => expect(fetchUsersWaitingForGroupKey).toHaveBeenCalledTimes(2));
	});
});

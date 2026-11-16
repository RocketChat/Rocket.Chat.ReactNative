import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { localSearchSubscription } from '../search';
import { type TAppDatabase } from '../../database/interfaces';
import { SubscriptionType } from '~/definitions';
import { createInMemoryAppDatabase } from '../../testUtils/inMemoryDatabase';

jest.unmock('../search');

let mockDatabase: TAppDatabase;
jest.mock('../../database/index', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

const mockState = {
	server: { version: '7.13.0' },
	settings: { E2E_Enable: true },
	encryption: { enabled: true },
	login: { user: { username: 'searcher' } }
};
jest.mock('../../store/auxStore', () => ({
	store: { getState: () => mockState }
}));

const seedRoom = (name: string, { encrypted, E2EKey }: { encrypted: boolean; E2EKey?: string }) =>
	mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: name }, subscriptions.schema);
			subscription.rid = name;
			subscription.name = name;
			subscription.t = SubscriptionType.GROUP;
			subscription.encrypted = encrypted;
			subscription.E2EKey = E2EKey;
		});
	});

const searchRoomNames = async (filterMessagingAllowed: boolean) => {
	const rooms = await localSearchSubscription({ text: 'room', filterMessagingAllowed });
	return rooms.map(({ name }) => name).sort();
};

beforeEach(async () => {
	mockState.settings.E2E_Enable = true;
	mockState.encryption.enabled = true;
	mockDatabase = createInMemoryAppDatabase();
	await seedRoom('plain-room', { encrypted: false });
	await seedRoom('encrypted-room-with-key', { encrypted: true, E2EKey: 'room-key' });
	await seedRoom('encrypted-room-without-key', { encrypted: true });
});

describe('searching rooms the user can message', () => {
	it('leaves out encrypted rooms whose key the user does not have yet', async () => {
		expect(await searchRoomNames(true)).toEqual(['encrypted-room-with-key', 'plain-room']);
	});

	it('leaves out every encrypted room when the user has not set up E2EE', async () => {
		mockState.encryption.enabled = false;

		expect(await searchRoomNames(true)).toEqual(['plain-room']);
	});

	it('keeps encrypted rooms when E2EE is disabled on the workspace', async () => {
		mockState.settings.E2E_Enable = false;
		mockState.encryption.enabled = false;

		expect(await searchRoomNames(true)).toEqual(['encrypted-room-with-key', 'encrypted-room-without-key', 'plain-room']);
	});

	it('keeps every room when the caller does not ask to filter by messaging', async () => {
		expect(await searchRoomNames(false)).toEqual(['encrypted-room-with-key', 'encrypted-room-without-key', 'plain-room']);
	});
});

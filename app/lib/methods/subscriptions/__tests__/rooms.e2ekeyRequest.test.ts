import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { waitFor } from '@testing-library/react-native';

import subscribeRooms, { roomsSubscription } from '../rooms';
import { Encryption } from '~/lib/encryption';
import {
	e2eGetUsersOfRoomWithoutKey,
	fetchUsersWaitingForGroupKey,
	provideUsersSuggestedGroupKeys
} from '~/lib/services/restApi';
import sdk from '~/lib/services/sdk';
import { type TAppDatabase } from '~/lib/database/interfaces';
import type { IDDPMessage } from '~/definitions/IDDPMessage';
import { createInMemoryAppDatabase } from '~/lib/testUtils/inMemoryDatabase';
import { generateMemberKeys, webClientDecryptGroupKey } from '~/lib/testUtils/e2eeWebClient';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';
import roomKeys from '~/lib/encryption/__tests__/fixtures/roomKeys.json';
import user from '~/lib/encryption/__tests__/fixtures/user.json';

jest.unmock('~/lib/encryption');

const mockOnStreamData = jest.fn(async (_event: string, _callback: (message: IDDPMessage) => void) => ({ stop: jest.fn() }));

jest.mock('~/lib/services/sdk', () => {
	const { makeSdkMock } = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
	return {
		__esModule: true,
		default: makeSdkMock({
			onStreamData: (...args: Parameters<typeof mockOnStreamData>) => mockOnStreamData(...args),
			subscribeNotifyUser: () => Promise.resolve([])
		})
	};
});

jest.mock('~/lib/services/restApi', () => ({
	...jest.requireActual('~/lib/services/restApi'),
	fetchUsersWaitingForGroupKey: jest.fn(),
	provideUsersSuggestedGroupKeys: jest.fn(),
	e2eGetUsersOfRoomWithoutKey: jest.fn(),
	e2eRequestRoomKey: jest.fn()
}));

let mockDatabase: TAppDatabase;
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockDatabase;
		}
	}
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		dispatch: jest.fn(),
		getState: () => ({
			server: { version: '7.13.0' },
			settings: { E2E_Enable: true },
			encryption: { enabled: true, banner: '' },
			login: { user: {} }
		})
	}
}));

const mockedSdk = sdk as unknown as SdkIntegration.IMockSdk;

const HOST = 'https://open.rocket.chat';
const ROOM_ID = 'room-id';
const MEMBER_ID = 'member-without-key';

let member: Awaited<ReturnType<typeof generateMemberKeys>>;

const keyRequestFrame = (keyId: string): IDDPMessage =>
	({
		msg: 'changed',
		collection: 'stream-notify-user',
		id: 'id',
		fields: { eventName: `${user.userId}/e2ekeyRequest`, args: [ROOM_ID, keyId] }
	}) as unknown as IDDPMessage;

const receive = async (frame: IDDPMessage) => {
	const providingRoomKey = jest.spyOn(Encryption, 'provideRoomKeyToUser');
	mockedSdk.setClient({ host: HOST });
	subscribeRooms();
	const [, handleStreamMessageReceived] = mockOnStreamData.mock.calls[0];
	handleStreamMessageReceived(frame);
	await waitFor(() => expect(providingRoomKey).toHaveBeenCalledTimes(1));
	await providingRoomKey.mock.results[0].value;
	providingRoomKey.mockRestore();
};

const sharedGroupKeys = () =>
	jest
		.mocked(provideUsersSuggestedGroupKeys)
		.mock.calls.map(([groupKeys]) => groupKeys as Record<string, { _id: string; key: string }[]>);

beforeAll(async () => {
	member = await generateMemberKeys();
});

beforeEach(async () => {
	jest.clearAllMocks();
	mockDatabase = createInMemoryAppDatabase();
	await mockDatabase.write(async () => {
		const subscriptions = mockDatabase.get('subscriptions');
		await subscriptions.create(subscription => {
			subscription._raw = sanitizedRaw({ id: ROOM_ID }, subscriptions.schema);
			subscription.rid = ROOM_ID;
			subscription.encrypted = true;
			subscription.E2EKey = roomKeys.v2.E2EKey;
			subscription.e2eKeyId = roomKeys.v2.keyID;
		});
	});
	jest.mocked(fetchUsersWaitingForGroupKey).mockResolvedValue({ success: true, usersWaitingForE2EKeys: {} } as any);
	jest.mocked(e2eGetUsersOfRoomWithoutKey).mockResolvedValue({
		success: true,
		users: [{ _id: MEMBER_ID, e2e: { public_key: member.publicKey } }]
	} as any);
	await Encryption.persistKeys(HOST, JSON.parse(user.publicKey), user.privateKey);
	Encryption.initialize(user.userId);
});

afterEach(() => {
	roomsSubscription?.stop();
	Encryption.stop();
});

describe('e2ekeyRequest from the room stream', () => {
	it('answers a request for the current key by sharing the room key with members who lack it', async () => {
		await receive(keyRequestFrame(roomKeys.v2.keyID));

		const [groupKeys] = sharedGroupKeys();
		expect(groupKeys[ROOM_ID].map(({ _id }) => _id)).toEqual([MEMBER_ID]);
		await expect(webClientDecryptGroupKey(member.privateKey, groupKeys[ROOM_ID][0].key)).resolves.toEqual({
			keyID: roomKeys.v2.keyID,
			sessionKey: JSON.parse(roomKeys.v2.sessionKeyExportedString)
		});
	});

	it('ignores a request for a key this client does not hold', async () => {
		await receive(keyRequestFrame(roomKeys.v1.keyID));

		expect(sharedGroupKeys()).toEqual([]);
	});
});

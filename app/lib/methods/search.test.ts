import { search, searchLocal, searchRemote, type TSearch } from './search';
import { spotlight } from '../services/restApi';
import database from '../database/index';
import { store as reduxStore } from '../store/auxStore';
import { type ISearch, type ISearchLocal, type IUserMessage } from '../../definitions';
import { type ISpotlightRoom, type TSpotlightUser } from '../../definitions/ISpotlight';

// jest.setup.js globally mocks this module - exercise the real implementation here
jest.unmock('./search');

jest.mock('../services/restApi', () => ({
	spotlight: jest.fn()
}));

jest.mock('../database/index', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

// Keep the watermelon query clauses out of the unit under test - we only assert on routing/merging
jest.mock('../database/utils', () => ({
	getSubscriptionSearchClause: jest.fn((text: string) => ({ clause: 'subscriptions', text })),
	sanitizeLikeString: jest.fn((str?: string) => str)
}));

jest.mock('./helpers', () => ({
	isGroupChat: jest.fn(() => false),
	isReadOnly: jest.fn(() => Promise.resolve(false))
}));

jest.mock('../encryption/utils', () => ({
	isE2EEDisabledEncryptedRoom: jest.fn(() => false),
	isMissingRoomE2EEKey: jest.fn(() => false)
}));

const mockedSpotlight = spotlight as jest.MockedFunction<typeof spotlight>;
const mockedGet = (database as any).active.get as jest.Mock;
const mockedGetState = reduxStore.getState as jest.Mock;

const buildSpotlightUser = (over: Partial<TSpotlightUser> = {}): TSpotlightUser => ({
	_id: 'u-id',
	username: 'john.doe',
	name: 'John Doe',
	status: 'online',
	outside: false,
	...over
});

const buildSpotlightRoom = (over: Partial<ISpotlightRoom> = {}): ISpotlightRoom => ({
	_id: 'room-id',
	name: 'general',
	t: 'c',
	...over
});

// A local subscription result (the shape returned by localSearchSubscription)
const buildLocalSubscription = (over: Partial<ISearch> = {}): TSearch =>
	({
		_id: 'sub-id',
		rid: 'sub-rid',
		name: 'jane.doe',
		fname: 'Jane Doe',
		avatarETag: 'etag',
		t: 'd',
		encrypted: false,
		...over
	} as ISearchLocal);

describe('searchRemote', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedSpotlight.mockResolvedValue({ users: [], rooms: [] });
	});

	it('does not call spotlight when there is no search text and returns local data', async () => {
		const localData = [buildLocalSubscription()];
		const result = await searchRemote({ text: '', localData });

		expect(mockedSpotlight).not.toHaveBeenCalled();
		expect(result).toEqual(localData);
	});

	it('still calls spotlight to augment even when local data already has many items', async () => {
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser()], rooms: [] });
		const localData = Array.from({ length: 7 }, (_, i) => buildLocalSubscription({ _id: `sub-${i}`, name: `user${i}` }));
		const result = await searchRemote({ text: 'foo', localData });

		expect(mockedSpotlight).toHaveBeenCalled();
		// 7 local + 1 spotlight user
		expect(result).toHaveLength(8);
	});

	it('appends spotlight users with the normalized search shape', async () => {
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser()], rooms: [] });

		const result = (await searchRemote({ text: 'john', localData: [] })) as ISearch[];

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			_id: 'u-id',
			rid: 'john.doe',
			name: 'john.doe',
			fname: 'John Doe',
			t: 'd',
			search: true
		});
	});

	it('removes duplicated spotlight users by _id', async () => {
		mockedSpotlight.mockResolvedValue({
			users: [buildSpotlightUser({ _id: 'dup' }), buildSpotlightUser({ _id: 'dup' })],
			rooms: []
		});

		const result = await searchRemote({ text: 'john', localData: [] });

		expect(result).toHaveLength(1);
	});

	it('removes spotlight users already present locally (subscription path matches by name)', async () => {
		const localData = [buildLocalSubscription({ name: 'john.doe' })];
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser({ username: 'john.doe' })], rooms: [] });

		const result = await searchRemote({ text: 'john', localData });

		// only the local item remains, the spotlight duplicate is dropped
		expect(result).toHaveLength(1);
		expect((result[0] as ISearch).search).toBeUndefined();
	});

	it('removes spotlight users already present locally (rid path matches by username)', async () => {
		const localData: IUserMessage[] = [{ _id: 'm1', username: 'john.doe', name: 'John Doe' }];
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser({ username: 'john.doe' })], rooms: [] });

		const result = await searchRemote({ text: 'john', rid: 'rid1', filterUsers: true, localData });

		expect(result).toHaveLength(1);
		expect((result[0] as ISearch).search).toBeUndefined();
	});

	it('appends spotlight rooms that are not present locally and skips existing ones', async () => {
		const localData = [buildLocalSubscription({ rid: 'existing-room' })];
		mockedSpotlight.mockResolvedValue({
			rooms: [buildSpotlightRoom({ _id: 'existing-room' }), buildSpotlightRoom({ _id: 'new-room', name: 'random' })],
			users: []
		});

		const result = (await searchRemote({ text: 'gen', filterUsers: false, filterRooms: true, localData })) as ISearch[];

		expect(result).toHaveLength(2);
		const appended = result.find(item => item.rid === 'new-room');
		expect(appended).toMatchObject({ rid: 'new-room', search: true });
	});

	it('does not append users when filterUsers is false', async () => {
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser()], rooms: [buildSpotlightRoom()] });

		const result = (await searchRemote({ text: 'foo', filterUsers: false, filterRooms: true, localData: [] })) as ISearch[];

		expect(result.some(item => item.search && item.rid === 'john.doe')).toBe(false);
		expect(result.some(item => item.rid === 'room-id')).toBe(true);
	});

	it('does not append rooms when filterRooms is false', async () => {
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser()], rooms: [buildSpotlightRoom()] });

		const result = (await searchRemote({ text: 'foo', filterUsers: true, filterRooms: false, localData: [] })) as ISearch[];

		expect(result.some(item => item.rid === 'room-id')).toBe(false);
		expect(result.some(item => item.rid === 'john.doe')).toBe(true);
	});

	it('passes local subscription names as usernames to spotlight', async () => {
		const localData = [buildLocalSubscription({ name: 'jane.doe' })];
		await searchRemote({ text: 'foo', localData });

		expect(mockedSpotlight).toHaveBeenCalledWith('foo', ['jane.doe'], { users: true, rooms: true, mentions: true }, '');
	});

	it('passes local message usernames to spotlight on the rid path', async () => {
		const localData: IUserMessage[] = [{ _id: 'm1', username: 'jane.doe', name: 'Jane Doe' }];
		await searchRemote({ text: 'foo', rid: 'rid1', filterUsers: true, localData });

		expect(mockedSpotlight).toHaveBeenCalledWith('foo', ['jane.doe'], { users: true, rooms: true, mentions: true }, 'rid1');
	});

	it('returns the local data when spotlight rejects', async () => {
		const localData = [buildLocalSubscription()];
		mockedSpotlight.mockRejectedValue(new Error('network'));

		const result = await searchRemote({ text: 'foo', localData });

		expect(result).toEqual(localData);
	});

	it('does not mutate the provided localData array', async () => {
		const localData = [buildLocalSubscription()];
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser()], rooms: [] });

		await searchRemote({ text: 'foo', localData });

		expect(localData).toHaveLength(1);
	});
});

describe('searchLocal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetState.mockReturnValue({
			login: { user: { id: 'me', username: 'me' } },
			settings: { Number_of_users_autocomplete_suggestions: 5 },
			encryption: { enabled: false }
		});
	});

	const mockCollections = (rowsByCollection: Record<string, any[]>) => {
		mockedGet.mockImplementation((collection: string) => ({
			query: () => ({ fetch: () => Promise.resolve(rowsByCollection[collection] ?? []) })
		}));
	};

	it('queries the subscriptions collection by default', async () => {
		mockCollections({ subscriptions: [buildLocalSubscription({ name: 'jane.doe' })] });

		const result = (await searchLocal({ text: 'jane' })) as ISearchLocal[];

		expect(mockedGet).toHaveBeenCalledWith('subscriptions');
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('jane.doe');
	});

	it('queries the messages collection when rid is set and filtering users', async () => {
		mockCollections({
			messages: [{ u: { _id: 'other', username: 'jane.doe', name: 'Jane Doe' } }]
		});

		const result = (await searchLocal({ text: 'jane', rid: 'rid1', filterUsers: true })) as IUserMessage[];

		expect(mockedGet).toHaveBeenCalledWith('messages');
		expect(result[0].username).toBe('jane.doe');
	});

	it('returns all matching subscription results without capping', async () => {
		mockCollections({
			subscriptions: Array.from({ length: 20 }, (_, i) => buildLocalSubscription({ _id: `s-${i}`, name: `user${i}` }))
		});

		const result = await searchLocal({ text: 'user' });

		expect(result).toHaveLength(20);
	});
});

describe('search', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetState.mockReturnValue({
			login: { user: { id: 'me', username: 'me' } },
			settings: { Number_of_users_autocomplete_suggestions: 5 },
			encryption: { enabled: false }
		});
		mockedGet.mockImplementation((collection: string) => ({
			query: () => ({
				fetch: () => Promise.resolve(collection === 'subscriptions' ? [buildLocalSubscription({ name: 'jane.doe' })] : [])
			})
		}));
	});

	it('merges local results with spotlight results', async () => {
		mockedSpotlight.mockResolvedValue({ users: [buildSpotlightUser({ username: 'john.doe' })], rooms: [] });

		const result = (await search({ text: 'doe' })) as ISearch[];

		// one local (jane) + one remote (john)
		expect(result).toHaveLength(2);
		expect(result.some(item => item.name === 'jane.doe')).toBe(true);
		expect(result.some(item => item.rid === 'john.doe' && item.search)).toBe(true);
	});
});

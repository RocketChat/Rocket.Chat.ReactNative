import { roomsAutoComplete, usersAutoComplete } from '~/lib/services/restApi';

import { searchChannels, searchUsers } from '../entitySearch';

jest.mock('~/lib/services/restApi', () => ({
	usersAutoComplete: jest.fn(),
	roomsAutoComplete: jest.fn()
}));

const mockedUsersAutoComplete = usersAutoComplete as jest.MockedFunction<typeof usersAutoComplete>;
const mockedRoomsAutoComplete = roomsAutoComplete as jest.MockedFunction<typeof roomsAutoComplete>;

describe('searchUsers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('maps users to username-valued items', async () => {
		mockedUsersAutoComplete.mockResolvedValue({
			items: [
				{ _id: '1', username: 'alice', name: 'Alice' },
				{ _id: '2', username: 'bob' }
			]
		} as any);
		await expect(searchUsers('al')).resolves.toEqual([
			{ value: 'alice', text: { text: 'Alice' } },
			{ value: 'bob', text: { text: 'bob' } }
		]);
		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({ term: 'al' });
	});

	it('queries the server default list for a blank term', async () => {
		mockedUsersAutoComplete.mockResolvedValue({
			items: [{ _id: '1', username: 'alice', name: 'Alice' }]
		} as any);
		await expect(searchUsers('   ')).resolves.toEqual([{ value: 'alice', text: { text: 'Alice' } }]);
		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({ term: '' });
	});

	it('returns nothing for failed searches', async () => {
		mockedUsersAutoComplete.mockResolvedValue({ success: false } as any);
		await expect(searchUsers('al')).resolves.toEqual([]);
	});

	it('returns nothing when the request rejects', async () => {
		mockedUsersAutoComplete.mockRejectedValue(new Error('network'));
		await expect(searchUsers('al')).resolves.toEqual([]);
	});
});

describe('searchChannels', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('maps rooms to id-valued items', async () => {
		mockedRoomsAutoComplete.mockResolvedValue({
			items: [
				{ _id: 'room1', fname: 'General' },
				{ _id: 'room2', name: 'random' }
			]
		} as any);
		await expect(searchChannels('gen')).resolves.toEqual([
			{ value: 'room1', text: { text: 'General' } },
			{ value: 'room2', text: { text: 'random' } }
		]);
		expect(mockedRoomsAutoComplete).toHaveBeenCalledWith({ name: 'gen' });
	});

	it('queries the server default list for a blank term', async () => {
		mockedRoomsAutoComplete.mockResolvedValue({ items: [{ _id: 'room1', fname: 'General' }] } as any);
		await expect(searchChannels('')).resolves.toEqual([{ value: 'room1', text: { text: 'General' } }]);
		expect(mockedRoomsAutoComplete).toHaveBeenCalledWith({ name: '' });
	});

	it('returns nothing for failed searches', async () => {
		mockedRoomsAutoComplete.mockResolvedValue({ success: false } as any);
		await expect(searchChannels('gen')).resolves.toEqual([]);
	});

	it('returns nothing when the request rejects', async () => {
		mockedRoomsAutoComplete.mockRejectedValue(new Error('network'));
		await expect(searchChannels('gen')).resolves.toEqual([]);
	});
});

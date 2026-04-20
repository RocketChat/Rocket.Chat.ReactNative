import { usersAutoComplete } from '../restApi';
import { getPeerAutocompleteOptions, type TPeerItem } from './getPeerAutocompleteOptions';

jest.mock('../restApi', () => ({
	usersAutoComplete: jest.fn()
}));

type TUsersAutoCompleteResponse = Awaited<ReturnType<typeof usersAutoComplete>>;

const mockedUsersAutoComplete = usersAutoComplete as jest.MockedFunction<typeof usersAutoComplete>;

type TAutoCompleteItem = {
	_id: string;
	name?: string;
	username?: string;
	freeSwitchExtension?: string;
};

const mockUsersAutoCompleteResponse = (
	items: TAutoCompleteItem[] = [],
	overrides: { success?: boolean; error?: string | null } = {}
): TUsersAutoCompleteResponse => {
	const { success = true, error = null } = overrides;
	return { items, success, error } as unknown as TUsersAutoCompleteResponse;
};

describe('getPeerAutocompleteOptions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns empty array and skips API call when filter is empty', async () => {
		await expect(
			getPeerAutocompleteOptions({
				filter: '',
				peerInfo: null,
				username: 'me',
				sipEnabled: false
			})
		).resolves.toEqual([]);

		expect(mockedUsersAutoComplete).not.toHaveBeenCalled();
	});

	it('does not trim the filter (trimming is the store boundary responsibility)', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		await getPeerAutocompleteOptions({
			filter: '  alice  ',
			peerInfo: null,
			username: 'me',
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: '  alice  ',
			exceptions: ['me']
		});
	});

	it('excludes the current username from results', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		await getPeerAutocompleteOptions({
			filter: 'ali',
			peerInfo: null,
			username: 'current.user',
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: 'ali',
			exceptions: ['current.user']
		});
	});

	it('omits current username from exceptions when it is not provided', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		await getPeerAutocompleteOptions({
			filter: 'ali',
			peerInfo: null,
			username: undefined,
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: 'ali',
			exceptions: []
		});
	});

	it('returns SIP option first then mapped user options (user branch)', async () => {
		mockedUsersAutoComplete.mockResolvedValue(
			mockUsersAutoCompleteResponse([
				{ _id: 'u1', name: 'Alice', username: 'alice', freeSwitchExtension: '1001' },
				{ _id: 'u2', name: '', username: 'bob', freeSwitchExtension: undefined }
			])
		);

		const result = await getPeerAutocompleteOptions({
			filter: 'ali',
			peerInfo: null,
			username: 'current.user',
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: 'ali',
			exceptions: ['current.user']
		});

		expect(result).toEqual([
			{ type: 'sip', value: 'ali', label: 'ali' },
			{
				type: 'user',
				value: 'u1',
				label: 'Alice',
				username: 'alice',
				callerId: '1001'
			},
			{
				type: 'user',
				value: 'u2',
				label: 'bob',
				username: 'bob',
				callerId: undefined
			}
		] satisfies TPeerItem[]);
	});

	it('SIP disabled: omits the freeSwitchExtension conditions entirely', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		await getPeerAutocompleteOptions({
			filter: 'alice',
			peerInfo: null,
			username: 'me',
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: 'alice',
			exceptions: ['me']
		});
	});

	it('SIP branch: when sipEnabled, adds freeSwitchExtension exists condition', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		await getPeerAutocompleteOptions({
			filter: '123',
			peerInfo: null,
			username: 'me',
			sipEnabled: true
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: '123',
			exceptions: ['me'],
			conditions: {
				$and: [{ freeSwitchExtension: { $exists: true } }]
			}
		});
	});

	it('SIP branch: when selected peer has callerId, excludes matching extension and adds peer username to exceptions', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		const peerInfo: TPeerItem = {
			type: 'user',
			value: 'other',
			label: 'Other',
			username: 'other.user',
			callerId: '2002'
		};

		await getPeerAutocompleteOptions({
			filter: '99',
			peerInfo,
			username: 'me',
			sipEnabled: true
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: '99',
			exceptions: ['me', 'other.user'],
			conditions: {
				$and: [{ freeSwitchExtension: { $exists: true } }, { freeSwitchExtension: { $ne: '2002' } }]
			}
		});
	});

	it('when sipEnabled is false but peer has callerId, still applies extension exclusion only', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse());

		const peerInfo: TPeerItem = {
			type: 'user',
			value: 'other',
			label: 'Other',
			username: 'peer',
			callerId: '3003'
		};

		await getPeerAutocompleteOptions({
			filter: 'x',
			peerInfo,
			username: undefined,
			sipEnabled: false
		});

		expect(mockedUsersAutoComplete).toHaveBeenCalledWith({
			term: 'x',
			exceptions: ['peer'],
			conditions: {
				$and: [{ freeSwitchExtension: { $ne: '3003' } }]
			}
		});
	});

	it('returns only SIP option when API returns success false with items', async () => {
		mockedUsersAutoComplete.mockResolvedValue(mockUsersAutoCompleteResponse([], { success: false, error: 'error-not-allowed' }));

		const result = await getPeerAutocompleteOptions({
			filter: 'solo',
			peerInfo: null,
			username: 'me',
			sipEnabled: false
		});

		expect(result).toEqual([{ type: 'sip', value: 'solo', label: 'solo' }]);
	});
});

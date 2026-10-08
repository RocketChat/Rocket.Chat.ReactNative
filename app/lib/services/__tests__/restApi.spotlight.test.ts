import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { spotlight } from '../restApi';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue({ users: [], rooms: [] }),
		get: jest.fn().mockResolvedValue({ users: [], rooms: [], success: true })
	}
}));

const type = { users: true, rooms: false, mentions: true };

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('spotlight', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.9.0');
	});

	it('calls the spotlight DDP method below 8.9.0', async () => {
		setServerVersion('8.8.0');
		await spotlight('john', ['a', 'b'], type);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('spotlight', 'john', ['a', 'b'], type);
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('passes rid to DDP below 8.9.0 when provided', async () => {
		setServerVersion('7.0.0');
		await spotlight('john', [], type, 'rid1');
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('spotlight', 'john', [], type, 'rid1');
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('calls GET spotlight on 8.9.0+ with usernames comma-joined and type as JSON', async () => {
		await spotlight('john', ['a', 'b'], type);
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			usernames: 'a,b',
			type: JSON.stringify(type)
		});
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('omits usernames and rid on 8.9.0+ when empty', async () => {
		await spotlight('john', [], type, '');
		expect((sdk.get as jest.Mock).mock.calls[0][1]).toStrictEqual({ query: 'john', type: JSON.stringify(type) });
	});

	it.each(['alice, bob', 'alice,bob'])('leaves the multi-user direct message name %j out of usernames on 8.9.0+', async name => {
		await spotlight('john', [name, 'carol'], type);
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			usernames: 'carol',
			type: JSON.stringify(type)
		});
	});

	it('omits usernames on 8.9.0+ when only multi-user direct message names are given', async () => {
		await spotlight('john', ['alice, bob'], type);
		expect((sdk.get as jest.Mock).mock.calls[0][1]).toStrictEqual({ query: 'john', type: JSON.stringify(type) });
	});

	it('passes multi-user direct message names to DDP below 8.9.0', async () => {
		setServerVersion('8.8.0');
		await spotlight('john', ['alice, bob'], type);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('spotlight', 'john', ['alice, bob'], type);
	});

	it('sends rid on 8.9.0+ when provided', async () => {
		await spotlight('john', ['a'], type, 'rid1');
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			usernames: 'a',
			type: JSON.stringify(type),
			rid: 'rid1'
		});
	});
});

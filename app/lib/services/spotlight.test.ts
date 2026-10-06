import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';
import { spotlight } from './restApi';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./sdk', () => ({
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
		setServerVersion('8.6.0');
	});

	it('uses DDP below 8.6.0 with the same arguments as before', async () => {
		setServerVersion('8.5.9');
		await spotlight('john', ['a', 'b'], type);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('spotlight', 'john', ['a', 'b'], type);
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('passes rid to DDP below 8.6.0 when provided', async () => {
		setServerVersion('7.0.0');
		await spotlight('john', [], type, 'rid1');
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('spotlight', 'john', [], type, 'rid1');
		expect(sdk.get).not.toHaveBeenCalled();
	});

	it('calls GET spotlight on 8.6.0+ with usernames comma-joined and type as JSON', async () => {
		await spotlight('john', ['a', 'b'], type);
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			usernames: 'a,b',
			type: JSON.stringify(type)
		});
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('omits usernames and rid on 8.6.0+ when empty', async () => {
		await spotlight('john', [], type, '');
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			type: JSON.stringify(type)
		});
	});

	it('sends rid on 8.6.0+ when provided', async () => {
		await spotlight('john', ['a'], type, 'rid1');
		expect(sdk.get).toHaveBeenCalledWith('spotlight', {
			query: 'john',
			usernames: 'a',
			type: JSON.stringify(type),
			rid: 'rid1'
		});
	});

	it('returns the REST response', async () => {
		const response = { users: [{ _id: 'u1' }], rooms: [], success: true };
		(sdk.get as jest.Mock).mockResolvedValueOnce(response);
		await expect(spotlight('john', [], type)).resolves.toBe(response);
	});
});

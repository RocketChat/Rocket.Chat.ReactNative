import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { getThreadMessages } from '../restApi';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		methodCallWrapper: jest.fn()
	}
}));

const mockedGet = sdk.get as jest.Mock;
const mockedMethodCallWrapper = sdk.methodCallWrapper as jest.Mock;

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('getThreadMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.8.0');
	});

	it('requests a newest-first page of the given size on 8.8.0+ and leaves the parent to the caller', async () => {
		mockedGet.mockResolvedValueOnce({ messages: [{ _id: 'tm1' }], count: 1, offset: 0, total: 80, success: true });

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0, count: 25 });

		expect(mockedGet).toHaveBeenCalledTimes(1);
		expect(mockedGet).toHaveBeenCalledWith('chat.getThreadMessages', { tmid: 'tmid', count: 25, offset: 0, sort: { ts: -1 } });
		expect(mockedMethodCallWrapper).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tm1' }], total: 80, threadParent: null });
	});

	it('throws when the page request is not successful', async () => {
		mockedGet.mockResolvedValueOnce({ success: false });

		await expect(getThreadMessages({ tmid: 'tmid', offset: 0, count: 50 })).rejects.toThrow();
	});

	it('loads the whole thread with the getThreadMessages DDP method on 8.7.x and separates the parent from the replies', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce([{ _id: 'tmid' }, { _id: 'tm1' }, { _id: 'tm2' }]);

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0, count: 50 });

		expect(mockedMethodCallWrapper).toHaveBeenCalledWith('getThreadMessages', { tmid: 'tmid' });
		expect(mockedGet).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tm1' }, { _id: 'tm2' }], total: 2, threadParent: { _id: 'tmid' } });
	});

	it('returns no parent on 8.7.x when the DDP method does not return it', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce([{ _id: 'tm1' }]);

		expect(await getThreadMessages({ tmid: 'tmid', offset: 0, count: 50 })).toEqual({
			messages: [{ _id: 'tm1' }],
			total: 1,
			threadParent: null
		});
	});

	it('returns an empty thread when the DDP method returns nothing', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce(null);

		expect(await getThreadMessages({ tmid: 'tmid', offset: 0, count: 50 })).toEqual({
			messages: [],
			total: 0,
			threadParent: null
		});
	});
});

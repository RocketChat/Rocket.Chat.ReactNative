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

	it('requests a newest-first page of 50 on 8.8.0+', async () => {
		mockedGet.mockResolvedValueOnce({ messages: [{ _id: 'tm1' }], count: 1, offset: 50, total: 80, success: true });

		const result = await getThreadMessages({ tmid: 'tmid', offset: 50 });

		expect(mockedGet).toHaveBeenCalledWith('chat.getThreadMessages', { tmid: 'tmid', count: 50, offset: 50, sort: { ts: -1 } });
		expect(mockedMethodCallWrapper).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tm1' }], total: 80 });
	});

	it('throws when the page request is not successful', async () => {
		mockedGet.mockResolvedValueOnce({ success: false });

		await expect(getThreadMessages({ tmid: 'tmid', offset: 0 })).rejects.toThrow();
	});

	it('loads the whole thread with the getThreadMessages DDP method on 8.7.x', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce([{ _id: 'tmid' }, { _id: 'tm1' }]);

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0 });

		expect(mockedMethodCallWrapper).toHaveBeenCalledWith('getThreadMessages', { tmid: 'tmid' });
		expect(mockedGet).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tmid' }, { _id: 'tm1' }], total: 2 });
	});

	it('returns an empty thread when the DDP method returns nothing', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce(null);

		expect(await getThreadMessages({ tmid: 'tmid', offset: 0 })).toEqual({ messages: [], total: 0 });
	});
});

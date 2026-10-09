import { store as reduxStore } from '../../store/auxStore';
import log from '../../methods/helpers/log';
import sdk from '../sdk';
import { getThreadMessages } from '../restApi';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
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
const mockedLog = log as jest.Mock;

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

const parentMessage = { _id: 'tmid', msg: 'parent' };
const firstPage = { messages: [{ _id: 'tm1' }], count: 1, offset: 0, total: 1, success: true };
const serve = ({
	page = () => Promise.resolve(firstPage),
	parent
}: {
	page?: () => Promise<unknown>;
	parent: () => Promise<unknown>;
}) => mockedGet.mockImplementation((endpoint: string) => (endpoint === 'chat.getMessage' ? parent() : page()));

describe('getThreadMessages', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.8.0');
	});

	it('requests a newest-first page of 50 on 8.8.0+ and no parent after the first page', async () => {
		mockedGet.mockResolvedValueOnce({ messages: [{ _id: 'tm1' }], count: 1, offset: 50, total: 80, success: true });

		const result = await getThreadMessages({ tmid: 'tmid', offset: 50 });

		expect(mockedGet).toHaveBeenCalledTimes(1);
		expect(mockedGet).toHaveBeenCalledWith('chat.getThreadMessages', { tmid: 'tmid', count: 50, offset: 50, sort: { ts: -1 } });
		expect(mockedMethodCallWrapper).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tm1' }], total: 80, threadParent: null });
	});

	it('fetches the thread parent with the first page on 8.8.0+ because the endpoint omits it', async () => {
		serve({
			parent: () => Promise.resolve({ message: parentMessage, success: true })
		});

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0 });

		expect(mockedGet).toHaveBeenCalledWith('chat.getMessage', { msgId: 'tmid' });
		expect(result).toEqual({ messages: [{ _id: 'tm1' }], total: 1, threadParent: parentMessage });
	});

	it('returns the first page without a parent and logs when the parent request fails', async () => {
		const error = new Error('429');
		serve({
			parent: () => Promise.reject(error)
		});

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0 });

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(result).toEqual({ messages: [{ _id: 'tm1' }], total: 1, threadParent: null });
	});

	it('returns the first page without a parent when the server does not return it', async () => {
		serve({
			parent: () => Promise.resolve({ success: false })
		});

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0 });

		expect(result.threadParent).toBeNull();
	});

	it('throws when the page request is not successful', async () => {
		serve({
			page: () => Promise.resolve({ success: false }),
			parent: () => Promise.resolve({ message: parentMessage, success: true })
		});

		await expect(getThreadMessages({ tmid: 'tmid', offset: 0 })).rejects.toThrow();
	});

	it('loads the whole thread with the getThreadMessages DDP method on 8.7.x without asking for the parent', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce([{ _id: 'tmid' }, { _id: 'tm1' }]);

		const result = await getThreadMessages({ tmid: 'tmid', offset: 0 });

		expect(mockedMethodCallWrapper).toHaveBeenCalledWith('getThreadMessages', { tmid: 'tmid' });
		expect(mockedGet).not.toHaveBeenCalled();
		expect(result).toEqual({ messages: [{ _id: 'tmid' }, { _id: 'tm1' }], total: 2, threadParent: null });
	});

	it('returns an empty thread when the DDP method returns nothing', async () => {
		setServerVersion('8.7.9');
		mockedMethodCallWrapper.mockResolvedValueOnce(null);

		expect(await getThreadMessages({ tmid: 'tmid', offset: 0 })).toEqual({ messages: [], total: 0, threadParent: null });
	});
});

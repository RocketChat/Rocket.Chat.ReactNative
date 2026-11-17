import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { readThreads } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(undefined),
		post: jest.fn().mockResolvedValue(undefined)
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('readThreads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.8.0');
	});

	it('posts chat.readThread on 8.8.0+', async () => {
		await readThreads('thread-id');
		expect(sdk.post).toHaveBeenCalledWith('chat.readThread', { tmid: 'thread-id' });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('calls the readThreads DDP method on 8.7.x', async () => {
		setServerVersion('8.7.5');
		await readThreads('thread-id');
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('readThreads', 'thread-id');
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('does nothing below 3.4.0', async () => {
		setServerVersion('3.3.9');
		await readThreads('thread-id');
		expect(sdk.post).not.toHaveBeenCalled();
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});

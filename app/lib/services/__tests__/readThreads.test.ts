import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { readThreads } from '../restApi';

jest.mock('../../store/auxStore', () => ({
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

const mockGetState = reduxStore.getState as jest.Mock;
const mockPost = sdk.post as jest.Mock;
const mockMethodCallWrapper = sdk.methodCallWrapper as jest.Mock;

describe('readThreads', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('uses REST on 8.8.0+', async () => {
		mockGetState.mockReturnValue({ server: { version: '8.8.0' } });

		await readThreads('thread-id');

		expect(mockPost).toHaveBeenCalledWith('chat.readThread', { tmid: 'thread-id' });
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
	});

	it('uses DDP on 8.7.x', async () => {
		mockGetState.mockReturnValue({ server: { version: '8.7.5' } });

		await readThreads('thread-id');

		expect(mockMethodCallWrapper).toHaveBeenCalledWith('readThreads', 'thread-id');
		expect(mockPost).not.toHaveBeenCalled();
	});

	it('does nothing below 3.4.0', async () => {
		mockGetState.mockReturnValue({ server: { version: '3.3.9' } });

		await readThreads('thread-id');

		expect(mockPost).not.toHaveBeenCalled();
		expect(mockMethodCallWrapper).not.toHaveBeenCalled();
	});
});

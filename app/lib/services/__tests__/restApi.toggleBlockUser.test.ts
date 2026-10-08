import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { toggleBlockUser } from '../restApi';

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn().mockResolvedValue(true),
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('toggleBlockUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.6.0');
	});

	it.each([
		{ block: true, method: 'blockUser' },
		{ block: false, method: 'unblockUser' }
	])('calls the $method DDP method below 8.6.0', async ({ block, method }) => {
		setServerVersion('8.5.9');
		await toggleBlockUser('rid1', 'user1', block);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith(method, { rid: 'rid1', blocked: 'user1' });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it.each([true, false])('posts im.blockUser with block %s on 8.6.0+', async block => {
		await toggleBlockUser('rid1', 'user1', block);
		expect(sdk.post).toHaveBeenCalledWith('im.blockUser', { roomId: 'rid1', block });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});

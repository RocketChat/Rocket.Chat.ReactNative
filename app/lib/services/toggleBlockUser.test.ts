import { store as reduxStore } from '../store/auxStore';
import sdk from './sdk';
import { toggleBlockUser } from './restApi';

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('./sdk', () => ({
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

	it('uses the blockUser DDP method below 8.6.0 with the same arguments as before', async () => {
		setServerVersion('8.5.9');
		await toggleBlockUser('rid1', 'user1', true);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('blockUser', { rid: 'rid1', blocked: 'user1' });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('uses the unblockUser DDP method below 8.6.0 with the same arguments as before', async () => {
		setServerVersion('8.5.9');
		await toggleBlockUser('rid1', 'user1', false);
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('unblockUser', { rid: 'rid1', blocked: 'user1' });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('posts im.blockUser with block true on 8.6.0+', async () => {
		await toggleBlockUser('rid1', 'user1', true);
		expect(sdk.post).toHaveBeenCalledWith('im.blockUser', { roomId: 'rid1', block: true });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('posts im.blockUser with block false on 8.6.0+', async () => {
		await toggleBlockUser('rid1', 'user1', false);
		expect(sdk.post).toHaveBeenCalledWith('im.blockUser', { roomId: 'rid1', block: false });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});

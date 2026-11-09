import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { saveRoomSettings } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		methodCallWrapper: jest.fn(),
		post: jest.fn().mockResolvedValue({ success: true, rid: 'rid1' })
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('saveRoomSettings', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('3.3.0');
	});

	it('calls the saveRoomSettings DDP method below 3.3.0', async () => {
		setServerVersion('3.2.9');
		await saveRoomSettings('rid1', { roomTopic: 'topic' });
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('saveRoomSettings', 'rid1', { roomTopic: 'topic' });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('posts rooms.saveRoomSettings on 3.3.0+', async () => {
		await saveRoomSettings('rid1', { roomAvatar: null, encrypted: true });
		expect(sdk.post).toHaveBeenCalledWith('rooms.saveRoomSettings', { rid: 'rid1', roomAvatar: null, encrypted: true });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});

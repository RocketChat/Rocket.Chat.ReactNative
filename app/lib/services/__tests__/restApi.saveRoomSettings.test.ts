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
		setServerVersion('9.0.0');
	});

	it('calls the saveRoomSettings DDP method below 9.0.0', async () => {
		setServerVersion('8.9.0');
		await saveRoomSettings('rid1', { roomTopic: 'topic' });
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('saveRoomSettings', 'rid1', { roomTopic: 'topic' });
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('posts rooms.saveRoomSettings on 9.0.0+', async () => {
		await saveRoomSettings('rid1', { roomAvatar: null, encrypted: true });
		expect(sdk.post).toHaveBeenCalledWith('rooms.saveRoomSettings', { rid: 'rid1', roomAvatar: null, encrypted: true });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('posts rooms.saveRoomSettings on a 9.0.0 release candidate', async () => {
		setServerVersion('9.0.0-rc.3');
		await saveRoomSettings('rid1', { roomName: 'name' });
		expect(sdk.post).toHaveBeenCalledWith('rooms.saveRoomSettings', { rid: 'rid1', roomName: 'name' });
	});

	it('resolves with result true when the REST call succeeds, as toggleRoomE2EE reads it', async () => {
		const response = await saveRoomSettings('rid1', { encrypted: true });
		expect(response).toEqual({ result: true, rid: 'rid1' });
	});
});

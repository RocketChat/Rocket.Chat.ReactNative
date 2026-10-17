import { store as reduxStore } from '~/lib/store/auxStore';
import sdk from '../sdk';
import { convertChannelToTeam } from '../restApi';

jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		post: jest.fn().mockResolvedValue({ success: true })
	}
}));

const setServerVersion = (version: string) => (reduxStore.getState as jest.Mock).mockReturnValue({ server: { version } });

describe('convertChannelToTeam', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('4.8.0');
	});

	it('posts only the channel id on 4.8.0+', async () => {
		await convertChannelToTeam({ rid: 'rid1', name: 'general', type: 'c' });
		expect(sdk.post).toHaveBeenCalledWith('channels.convertToTeam', { channelId: 'rid1' });
	});

	it('posts only the room id for groups on 4.8.0+', async () => {
		await convertChannelToTeam({ rid: 'rid1', name: 'private', type: 'p' });
		expect(sdk.post).toHaveBeenCalledWith('groups.convertToTeam', { roomId: 'rid1' });
	});

	it('posts the channel name below 4.8.0', async () => {
		setServerVersion('4.7.9');
		await convertChannelToTeam({ rid: 'rid1', name: 'general', type: 'c' });
		expect(sdk.post).toHaveBeenCalledWith('channels.convertToTeam', { channelId: 'rid1', channelName: 'general' });
	});

	it('posts the room name for groups below 4.8.0', async () => {
		setServerVersion('4.7.9');
		await convertChannelToTeam({ rid: 'rid1', name: 'private', type: 'p' });
		expect(sdk.post).toHaveBeenCalledWith('groups.convertToTeam', { roomId: 'rid1', roomName: 'private' });
	});
});

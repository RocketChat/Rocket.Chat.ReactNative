import { store as reduxStore } from '../../store/auxStore';
import sdk from '../sdk';
import { joinRoom } from '../restApi';

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

describe('joinRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setServerVersion('8.6.0');
	});

	it('calls the joinRoom DDP method for groups below 8.6.0', async () => {
		setServerVersion('8.5.9');
		await joinRoom('rid1', null, 'p');
		expect(sdk.methodCallWrapper).toHaveBeenCalledWith('joinRoom', 'rid1');
		expect(sdk.post).not.toHaveBeenCalled();
	});

	it('posts rooms.join for groups on 8.6.0+', async () => {
		await joinRoom('rid1', null, 'p');
		expect(sdk.post).toHaveBeenCalledWith('rooms.join', { roomId: 'rid1' });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});

	it('sends the join code to rooms.join for groups on 8.6.0+', async () => {
		await joinRoom('rid1', 'secret', 'p');
		expect(sdk.post).toHaveBeenCalledWith('rooms.join', { roomId: 'rid1', joinCode: 'secret' });
	});

	it('posts channels.join for channels on any version', async () => {
		await joinRoom('rid1', 'secret', 'c');
		expect(sdk.post).toHaveBeenCalledWith('channels.join', { roomId: 'rid1', joinCode: 'secret' });
		setServerVersion('7.0.0');
		await joinRoom('rid2', null, 'c');
		expect(sdk.post).toHaveBeenLastCalledWith('channels.join', { roomId: 'rid2', joinCode: null });
		expect(sdk.methodCallWrapper).not.toHaveBeenCalled();
	});
});

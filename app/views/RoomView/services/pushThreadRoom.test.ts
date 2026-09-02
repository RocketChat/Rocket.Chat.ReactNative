import { sendLoadingEvent } from '../../../containers/Loading';
import { E2E_MESSAGE_TYPE } from '../../../lib/constants/keys';
import { SubscriptionType } from '../../../definitions';
import { fetchThreadName } from './fetchThreadName';
import { pushThreadRoom } from './pushThreadRoom';

jest.mock('../../../containers/Loading', () => ({
	sendLoadingEvent: jest.fn()
}));
jest.mock('./fetchThreadName', () => ({
	fetchThreadName: jest.fn(() => Promise.resolve('Thread title'))
}));

const mockFetchThreadName = fetchThreadName as jest.Mock;
const mockSendLoadingEvent = sendLoadingEvent as jest.Mock;

const navigation = { push: jest.fn() } as any;
const onCancel = jest.fn();

const push = (item: any) => pushThreadRoom({ rid: 'rid-1', item, roomUserId: 'user-1', navigation, onCancel });

describe('pushThreadRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFetchThreadName.mockResolvedValue('Thread title');
	});

	it('opens the parent thread of a reply, resolving its name', async () => {
		await push({ id: 'msg-1', tmid: 'tmid-1', tmsg: 'known name' });

		expect(mockFetchThreadName).toHaveBeenCalledWith('rid-1', 'tmid-1', 'msg-1', 'known name');
		expect(mockSendLoadingEvent).toHaveBeenCalledWith({ visible: true, onCancel });
		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'tmid-1',
			name: 'Thread title',
			t: SubscriptionType.THREAD,
			roomUserId: 'user-1',
			jumpToMessageId: 'msg-1'
		});
	});

	it('stops and hides the overlay when the thread name cannot be resolved', async () => {
		mockFetchThreadName.mockResolvedValue(undefined);

		await push({ id: 'msg-1', tmid: 'tmid-1' });

		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(navigation.push).not.toHaveBeenCalled();
	});

	it('hides the overlay and rethrows when the thread name lookup fails', async () => {
		const error = new Error('lookup failed');
		mockFetchThreadName.mockRejectedValue(error);

		await expect(push({ id: 'msg-1', tmid: 'tmid-1' })).rejects.toThrow(error);

		expect(mockSendLoadingEvent).toHaveBeenLastCalledWith({ visible: false });
		expect(navigation.push).not.toHaveBeenCalled();
	});

	it('titles an undecrypted thread as an encrypted message', async () => {
		await push({ id: 'msg-1', tmid: 'tmid-1', t: E2E_MESSAGE_TYPE, e2e: 'pending' });

		expect(navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ name: 'Encrypted message' }));
	});

	it('opens a thread rooted at the message itself when it has no parent', async () => {
		await push({ id: 'msg-1', msg: 'hello', tlm: undefined });

		expect(navigation.push).toHaveBeenCalledWith('RoomView', {
			rid: 'rid-1',
			tmid: 'msg-1',
			name: 'hello',
			t: SubscriptionType.THREAD,
			roomUserId: 'user-1'
		});
	});

	it('does nothing without a rid', async () => {
		await pushThreadRoom({ rid: undefined, item: { tmid: 'tmid-1' }, roomUserId: null, navigation });

		expect(navigation.push).not.toHaveBeenCalled();
	});
});

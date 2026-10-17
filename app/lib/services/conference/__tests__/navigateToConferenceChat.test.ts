import { SubscriptionType } from '~/definitions';
import getThreadName from '~/lib/methods/getThreadName';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { navigateToConferenceChat } from '../navigateToConferenceChat';
import { useConferenceCallStore } from '../useConferenceCallStore';

jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn(() => Promise.resolve()) }));
jest.mock('~/lib/methods/getThreadName', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({
	navigate: jest.fn(),
	push: jest.fn(),
	getCurrentRoute: jest.fn(() => undefined)
}));

const chat = { rid: 'GENERAL', name: 'general', t: SubscriptionType.CHANNEL };
const currentRoute = Navigation.getCurrentRoute as jest.Mock;

describe('navigateToConferenceChat', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConferenceCallStore.getState().close();
		useConferenceCallStore.getState().open({ callId: 'call1' });
	});

	it('minimizes the call so the chat does not open underneath it', async () => {
		currentRoute.mockReturnValue({ name: 'ConferenceView' });

		await navigateToConferenceChat({ chat, isMasterDetail: false });

		expect(useConferenceCallStore.getState().expanded).toBe(false);
		expect(useConferenceCallStore.getState().callId).toBe('call1');
	});

	it('goes to the chats navigator first when the call was opened from somewhere else', async () => {
		currentRoute.mockReturnValue({ name: 'ConferenceView' });

		await navigateToConferenceChat({ chat, isMasterDetail: false });

		expect(Navigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
		expect(goRoom).toHaveBeenCalledWith({ item: chat, isMasterDetail: false });
	});

	it('stays in the room, without opening any thread, when the chat lives in the room', async () => {
		currentRoute.mockReturnValue({ name: 'RoomsListView' });

		await navigateToConferenceChat({ chat, isMasterDetail: false });

		expect(Navigation.push).not.toHaveBeenCalled();
	});

	describe('when the chat lives in a thread', () => {
		beforeEach(() => {
			currentRoute.mockReturnValue({ name: 'RoomsListView' });
			(getThreadName as jest.Mock).mockResolvedValue('Standup');
		});

		it('opens the room and then the thread of the call message, named after it', async () => {
			await navigateToConferenceChat({ chat, threadId: 'started-message', isMasterDetail: false });

			expect(goRoom).toHaveBeenCalledWith({ item: chat, isMasterDetail: false });
			expect(getThreadName).toHaveBeenCalledWith('GENERAL', 'started-message', '');
			expect(Navigation.push).toHaveBeenCalledWith('RoomView', {
				rid: 'GENERAL',
				tmid: 'started-message',
				name: 'Standup',
				t: SubscriptionType.THREAD
			});
		});

		it('opens the thread under a generic name when its own name cannot be found', async () => {
			(getThreadName as jest.Mock).mockResolvedValue(undefined);

			await navigateToConferenceChat({ chat, threadId: 'started-message', isMasterDetail: false });

			expect(Navigation.push).toHaveBeenCalledWith('RoomView', expect.objectContaining({ name: 'Video call' }));
		});

		it('does not open the same thread a second time while already in it', async () => {
			currentRoute.mockReturnValue({ name: 'RoomView', params: { rid: 'GENERAL', tmid: 'started-message' } });

			await navigateToConferenceChat({ chat, threadId: 'started-message', isMasterDetail: false });

			expect(goRoom).not.toHaveBeenCalled();
			expect(Navigation.push).not.toHaveBeenCalled();
		});
	});

	it.each(['RoomsListView', 'RoomView'])('goes straight to the room when already in %s', async name => {
		currentRoute.mockReturnValue({ name });

		await navigateToConferenceChat({ chat, isMasterDetail: true });

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(goRoom).toHaveBeenCalledWith({ item: chat, isMasterDetail: true });
	});
});

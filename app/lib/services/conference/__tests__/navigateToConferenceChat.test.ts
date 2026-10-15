import { SubscriptionType } from '~/definitions';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import Navigation from '~/lib/navigation/appNavigation';
import { navigateToConferenceChat } from '../navigateToConferenceChat';
import { useConferenceCallStore } from '../useConferenceCallStore';

jest.mock('~/lib/methods/helpers/goRoom', () => ({ goRoom: jest.fn(() => Promise.resolve()) }));
jest.mock('~/lib/navigation/appNavigation', () => ({
	navigate: jest.fn(),
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

	it.each(['RoomsListView', 'RoomView'])('goes straight to the room when already in %s', async name => {
		currentRoute.mockReturnValue({ name });

		await navigateToConferenceChat({ chat, isMasterDetail: true });

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(goRoom).toHaveBeenCalledWith({ item: chat, isMasterDetail: true });
	});
});

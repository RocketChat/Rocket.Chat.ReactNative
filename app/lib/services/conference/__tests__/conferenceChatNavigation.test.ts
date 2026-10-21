import Navigation from '~/lib/navigation/appNavigation';
import { createConferenceChatNavigation } from '../conferenceChatNavigation';

jest.mock('~/lib/navigation/appNavigation', () => ({
	navigate: jest.fn(),
	push: jest.fn(),
	getCurrentRoute: jest.fn()
}));
jest.mock('../conferenceCallNavigation', () => ({ CONFERENCE_ROUTE: 'ConferenceView' }));

const currentRoute = Navigation.getCurrentRoute as jest.Mock;

describe('createConferenceChatNavigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('from the call screen', () => {
		beforeEach(() => {
			currentRoute.mockReturnValue({ name: 'ConferenceView' });
		});

		it('goes to the chats before opening a screen of the app, so the screen can be found', () => {
			createConferenceChatNavigation().navigate('RoomInfoView', { rid: 'GENERAL' });

			expect(Navigation.navigate).toHaveBeenNthCalledWith(1, 'ChatsStackNavigator');
			expect(Navigation.navigate).toHaveBeenNthCalledWith(2, 'RoomInfoView', { rid: 'GENERAL' });
		});

		it('does the same when it pushes a screen', () => {
			createConferenceChatNavigation().push('RoomView', { rid: 'GENERAL', tmid: 'thread' });

			expect(Navigation.navigate).toHaveBeenCalledWith('ChatsStackNavigator');
			expect(Navigation.push).toHaveBeenCalledWith('RoomView', { rid: 'GENERAL', tmid: 'thread' });
		});
	});

	it('opens a screen directly when the call screen is not the one showing', () => {
		currentRoute.mockReturnValue({ name: 'RoomView' });

		createConferenceChatNavigation().navigate('RoomInfoView', { rid: 'GENERAL' });

		expect(Navigation.navigate).toHaveBeenCalledTimes(1);
		expect(Navigation.navigate).toHaveBeenCalledWith('RoomInfoView', { rid: 'GENERAL' });
	});

	describe('what a screen of its own would do, which a sheet has no use for', () => {
		it('has nowhere to go back to', () => {
			const navigation = createConferenceChatNavigation();

			expect(navigation.canGoBack()).toBe(false);
			expect(() => navigation.goBack()).not.toThrow();
		});

		it('ignores changes to its own header and params', () => {
			const navigation = createConferenceChatNavigation();

			expect(() => {
				navigation.setOptions();
				navigation.setParams();
			}).not.toThrow();
		});

		it('is always in focus, and listening to focus changes is harmless', () => {
			const navigation = createConferenceChatNavigation();

			expect(navigation.isFocused()).toBe(true);
			expect(() => navigation.addListener()()).not.toThrow();
		});

		it('has no parent navigator', () => {
			expect(createConferenceChatNavigation().getParent()).toBeUndefined();
		});
	});
});

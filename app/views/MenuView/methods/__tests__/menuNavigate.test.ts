import { menuNavigate } from '../menuNavigate';
import Navigation from '~/lib/navigation/appNavigation';
import { logEvent } from '~/lib/methods/helpers/log';

jest.mock('~/lib/methods/helpers/log', () => ({
	events: { SIDEBAR_GO_PROFILE: 'sidebar_go_profile' },
	logEvent: jest.fn()
}));

const mockNavigate = jest.fn();

describe('menuNavigate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Navigation.navigationRef.current = { navigate: mockNavigate } as any;
	});

	it('navigates to the route', () => {
		menuNavigate('AccessibilityAndAppearanceView');

		expect(mockNavigate).toHaveBeenCalledWith('AccessibilityAndAppearanceView', undefined);
	});

	it('logs the event named after the route', () => {
		menuNavigate('ProfileView');

		expect(logEvent).toHaveBeenCalledWith('sidebar_go_profile');
	});
});

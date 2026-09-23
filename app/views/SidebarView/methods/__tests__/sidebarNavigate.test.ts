import { sidebarNavigate } from '../sidebarNavigate';
import Navigation from '~/lib/navigation/appNavigation';

jest.mock('~/lib/methods/helpers/log', () => ({
	events: {},
	logEvent: jest.fn()
}));

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

describe('sidebarNavigate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Navigation.navigationRef.current = { navigate: mockNavigate, dispatch: mockDispatch } as any;
	});

	it('navigates to the route', () => {
		sidebarNavigate('AccessibilityStackNavigator');

		expect(mockNavigate).toHaveBeenCalledWith('AccessibilityStackNavigator', undefined);
	});

	it('closes the drawer even when navigating to the focused route', () => {
		sidebarNavigate('AccessibilityStackNavigator');

		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLOSE_DRAWER' }));
	});
});

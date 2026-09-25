import { fireEvent, render } from '@testing-library/react-native';

import Apps from './Apps';
import { triggerAppActionButton } from '~/lib/apps/triggerAppActionButton';
import { useAppActionButtons } from '~/lib/apps/useAppActionButtons';

jest.mock('~/lib/apps/useAppActionButtons', () => ({ useAppActionButtons: jest.fn() }));
jest.mock('~/lib/apps/triggerAppActionButton', () => ({ triggerAppActionButton: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ events: { SIDEBAR_APP_ACTION: 'sidebar_app_action' }, logEvent: jest.fn() }));

const mockedHook = useAppActionButtons as jest.Mock;
const navigation = { closeDrawer: jest.fn() } as any;

const button = { appId: 'app-1', actionId: 'open-thing', context: 'userDropdownAction', labelI18n: 'open_thing' };
const item = { id: 'app-1/open-thing', label: 'Open thing', button };

describe('Sidebar Apps', () => {
	beforeEach(() => jest.clearAllMocks());

	it('asks for user dropdown buttons', () => {
		mockedHook.mockReturnValue([]);
		render(<Apps navigation={navigation} />);
		expect(mockedHook).toHaveBeenCalledWith({ context: 'userDropdownAction' });
	});

	it('renders nothing without buttons', () => {
		mockedHook.mockReturnValue([]);
		const { toJSON } = render(<Apps navigation={navigation} />);
		expect(toJSON()).toBeNull();
	});

	it('renders one item per button with its label', () => {
		mockedHook.mockReturnValue([item]);
		const { getByTestId, getByText } = render(<Apps navigation={navigation} />);
		expect(getByTestId('sidebar-app-app-1/open-thing')).toBeTruthy();
		expect(getByText('Open thing')).toBeTruthy();
	});

	it('closes the drawer and triggers the app action', () => {
		mockedHook.mockReturnValue([item]);
		const { getByTestId } = render(<Apps navigation={navigation} />);
		fireEvent.press(getByTestId('sidebar-app-app-1/open-thing'));

		expect(navigation.closeDrawer).toHaveBeenCalled();
		expect(triggerAppActionButton).toHaveBeenCalledWith({ button });
	});
});

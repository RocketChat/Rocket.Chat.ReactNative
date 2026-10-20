import { fireEvent, render } from '@testing-library/react-native';

import Apps from './Apps';
import { triggerAppActionButton } from '~/lib/apps/actions';
import { type IAppActionButtonItem, useAppActionButtons } from '~/lib/apps/useAppActionButtons';
import { logEvent } from '~/lib/methods/helpers/log';
import Navigation from '~/lib/navigation/appNavigation';

jest.mock('~/lib/apps/useAppActionButtons', () => ({ useAppActionButtons: jest.fn() }));
jest.mock('~/lib/apps/actions', () => ({ triggerAppActionButton: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ events: { SIDEBAR_APP_ACTION: 'sidebar_app_action' }, logEvent: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({ dispatch: jest.fn() }));

const mockedHook = useAppActionButtons as jest.Mock;

const item = (actionId: string, context: string): IAppActionButtonItem =>
	({
		id: `app-1/${actionId}`,
		label: `Label ${actionId}`,
		button: { appId: 'app-1', actionId, context, labelI18n: actionId }
	}) as IAppActionButtonItem;

describe('Sidebar Apps', () => {
	beforeEach(() => jest.clearAllMocks());

	it('asks for buttons without a room', () => {
		mockedHook.mockReturnValue([]);
		render(<Apps />);
		expect(mockedHook).toHaveBeenCalledWith();
	});

	it('renders nothing without user dropdown buttons', () => {
		mockedHook.mockReturnValue([item('room-thing', 'roomAction')]);
		const { toJSON } = render(<Apps />);
		expect(toJSON()).toBeNull();
	});

	it('renders only user dropdown buttons, with their label', () => {
		mockedHook.mockReturnValue([item('open-thing', 'userDropdownAction'), item('room-thing', 'roomAction')]);
		const { getByText, queryByTestId } = render(<Apps />);
		expect(getByText('Label open-thing')).toBeTruthy();
		expect(queryByTestId('sidebar-app-app-1/room-thing')).toBeNull();
	});

	it('closes the drawer and triggers the app action', () => {
		const dropdownItem = item('open-thing', 'userDropdownAction');
		mockedHook.mockReturnValue([dropdownItem]);
		const { getByTestId } = render(<Apps />);
		fireEvent.press(getByTestId('sidebar-app-app-1/open-thing'));

		expect(logEvent).toHaveBeenCalledWith('sidebar_app_action', { appId: 'app-1', actionId: 'open-thing' });
		expect(Navigation.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'CLOSE_DRAWER' }));
		expect(triggerAppActionButton).toHaveBeenCalledWith({ button: dropdownItem.button });
	});
});

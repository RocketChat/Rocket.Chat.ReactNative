import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import ActionsSection from '../ActionsSection';
import { SubscriptionType } from '~/definitions';
import { mockedStore } from '~/reducers/mockedStore';
import { addUsersToRoom } from '~/lib/services/restApi';
import { showErrorAlertWithEMessage } from '~/lib/methods/helpers';

const mockNavigate = jest.fn();
const mockPop = jest.fn();

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ navigate: mockNavigate, pop: mockPop })
}));

jest.mock('~/lib/services/restApi', () => ({
	addUsersToRoom: jest.fn()
}));

jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => [true, false, false, false]
}));

jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	showErrorAlertWithEMessage: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	events: {},
	logEvent: jest.fn()
}));

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('ActionsSection add users', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows the error and stays on the screen when adding users fails', async () => {
		const error = new Error('error-user-is-banned');
		jest.mocked(addUsersToRoom).mockRejectedValue(error);
		const { getByTestId } = render(<ActionsSection rid='rid1' t={SubscriptionType.CHANNEL} joined abacAttributes={undefined} />, {
			wrapper: Wrapper
		});

		fireEvent.press(getByTestId('room-actions-add-user'));
		await mockNavigate.mock.calls[0][1].nextAction();

		expect(addUsersToRoom).toHaveBeenCalledWith('rid1', 'c');
		expect(showErrorAlertWithEMessage).toHaveBeenCalledWith(error);
		expect(mockPop).not.toHaveBeenCalled();
		expect(mockedStore.getState().selectedUsers.loading).toBe(false);
	});
});

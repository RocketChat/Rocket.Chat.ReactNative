import { type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../reducers/mockedStore';
import { setUser } from '../../actions/login';
import { addSettings } from '../../actions/settings';
import { selectServerSuccess } from '../../actions/server';
import { initStore } from '../../lib/store/auxStore';
import StatusView from './index';

const mockNavigationSetOptions = jest.fn();
const mockNavigationGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
	const actualNav = jest.requireActual('@react-navigation/native');
	const { useEffect } = require('react');
	return {
		...actualNav,
		useFocusEffect: useEffect,
		isFocused: () => true,
		useIsFocused: () => true,
		useRoute: () => jest.fn(),
		useNavigation: jest.fn(() => ({
			navigate: jest.fn(),
			addListener: () => jest.fn(),
			setOptions: mockNavigationSetOptions,
			goBack: mockNavigationGoBack
		})),
		createNavigationContainerRef: jest.fn(),
		navigate: jest.fn(),
		addListener: jest.fn(() => jest.fn())
	};
});

const mockSetUserStatus = jest.fn();
jest.mock('../../lib/services/restApi', () => ({
	setUserStatus: (...args: unknown[]) => mockSetUserStatus(...args)
}));

const mockShowToast = jest.fn();
jest.mock('../../lib/methods/helpers/showToast', () => ({
	showToast: (...args: unknown[]) => mockShowToast(...args)
}));

const mockShowErrorAlertWithEMessage = jest.fn();
jest.mock('../../lib/methods/helpers/info', () => ({
	showErrorAlertWithEMessage: (...args: unknown[]) => mockShowErrorAlertWithEMessage(...args)
}));

const mockShowActionSheet = jest.fn();
const mockHideActionSheet = jest.fn();
jest.mock('../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet, hideActionSheet: mockHideActionSheet })
}));

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const renderStatusView = () => render(<StatusView />, { wrapper: Wrapper });

describe('StatusView', () => {
	beforeAll(() => {
		initStore(mockedStore);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('rendering', () => {
		it('should render all status options for legacy server', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.getByTestId('status-view-online')).toBeOnTheScreen();
			expect(screen.getByTestId('status-view-busy')).toBeOnTheScreen();
			expect(screen.getByTestId('status-view-away')).toBeOnTheScreen();
			expect(screen.getByTestId('status-view-offline')).toBeOnTheScreen();
		});

		it('should hide offline when Accounts_AllowInvisibleStatusOption is false', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: false }));

			renderStatusView();

			expect(screen.getByTestId('status-view-online')).toBeOnTheScreen();
			expect(screen.getByTestId('status-view-busy')).toBeOnTheScreen();
			expect(screen.getByTestId('status-view-away')).toBeOnTheScreen();
			expect(screen.queryByTestId('status-view-offline')).toBeNull();
		});

		it('should show ClearAfterPicker when server >= 8.6.0', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.getByTestId('status-view-clear-after')).toBeOnTheScreen();
		});

		it('should hide ClearAfterPicker when server < 8.6.0', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.queryByTestId('status-view-clear-after')).toBeNull();
		});

		it('should always show away option regardless of server version', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.getByTestId('status-view-away')).toBeOnTheScreen();
		});

		it('should render status text input', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.getByTestId('status-view-input')).toBeOnTheScreen();
		});
	});

	describe('submit button', () => {
		it('should be disabled when no changes are made', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			const submit = screen.getByTestId('status-view-submit');
			// RectButton uses enabled prop — toBeDisabled() doesn't work with the mock
			expect(submit.props.enabled).toBe(false);
		});

		it('should be enabled when status is changed', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-busy'));

			expect(screen.getByTestId('status-view-submit')).not.toBeDisabled();
		});

		it('should be enabled when status text is changed', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			fireEvent.changeText(screen.getByTestId('status-view-input'), 'New status');

			expect(screen.getByTestId('status-view-submit')).not.toBeDisabled();
		});
	});

	describe('submit action', () => {
		it('should call setUserStatus with status and statusText', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
			mockSetUserStatus.mockResolvedValue(undefined);

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-busy'));
			fireEvent.press(screen.getByTestId('status-view-submit'));

			expect(mockSetUserStatus).toHaveBeenCalledWith('busy', '', undefined);
		});

		it('should call setUserStatus on modern server with status change', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
			mockSetUserStatus.mockResolvedValue(undefined);

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-busy'));

			fireEvent.press(screen.getByTestId('status-view-submit'));

			expect(mockSetUserStatus).toHaveBeenCalledWith('busy', '', undefined);
		});

		it('should not submit if nothing has changed', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
			mockSetUserStatus.mockResolvedValue(undefined);

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-submit'));

			expect(mockSetUserStatus).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('should show error alert when setUserStatus fails', async () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '6.0.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
			const error = new Error('Network error');
			mockSetUserStatus.mockRejectedValue(error);

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-busy'));
			fireEvent.press(screen.getByTestId('status-view-submit'));

			await waitFor(() => expect(mockShowErrorAlertWithEMessage).toHaveBeenCalledWith(error));
		});
	});

	describe('ClearAfterPicker', () => {
		it('should show initial clear after state when user has no statusExpiresAt', () => {
			mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));

			renderStatusView();

			expect(screen.getByTestId('status-view-clear-after')).toBeOnTheScreen();
		});

		it('should not pass statusExpiresAt on submit when picker was not touched', () => {
			mockedStore.dispatch(
				setUser({
					id: 'user-id',
					username: 'user',
					status: 'away',
					statusText: '',
					statusExpiresAt: '2026-06-20T15:00:00.000Z'
				})
			);
			mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
			mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
			mockSetUserStatus.mockResolvedValue(undefined);

			renderStatusView();

			fireEvent.press(screen.getByTestId('status-view-online'));
			fireEvent.press(screen.getByTestId('status-view-submit'));

			expect(mockSetUserStatus).toHaveBeenCalledWith('online', '', undefined);
		});

		it('should pass expiresAt on submit when picker is interacted with', () => {
			jest.useFakeTimers();
			jest.setSystemTime(new Date('2026-06-22T12:00:00.000Z'));
			try {
				mockedStore.dispatch(setUser({ id: 'user-id', username: 'user', status: 'online', statusText: '' }));
				mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '8.6.0', name: 'Test' }));
				mockedStore.dispatch(addSettings({ Accounts_AllowInvisibleStatusOption: true }));
				mockSetUserStatus.mockResolvedValue(undefined);

				renderStatusView();

				fireEvent.press(screen.getByTestId('status-view-clear-after'));

				expect(mockShowActionSheet).toHaveBeenCalled();
				const { children } = mockShowActionSheet.mock.calls[0][0] as { children: any };
				const { onConfirm } = children.props;
				act(() => onConfirm('30', null));

				fireEvent.press(screen.getByTestId('status-view-submit'));

				expect(mockSetUserStatus).toHaveBeenCalledWith('online', '', '2026-06-22T12:30:00.000Z');
			} finally {
				jest.useRealTimers();
			}
		});
	});
});

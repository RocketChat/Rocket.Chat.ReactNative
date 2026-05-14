import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch } from 'react-redux';

import UserPreferencesView from './index';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { saveUserPreferences } from '../../lib/services/restApi';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn()
}));

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	saveUserPreferences: jest.fn()
}));

jest.mock('./ListPicker', () => () => null);

describe('UserPreferencesView', () => {
	const dispatch = jest.fn();
	const navigation = {
		setOptions: jest.fn(),
		navigate: jest.fn()
	};

	const mockState = ({
		convertAsciiEmoji,
		enableMobileRinging
	}: {
		convertAsciiEmoji: boolean;
		enableMobileRinging: boolean;
	}) => ({
		login: {
			user: {
				id: 'user-id',
				enableMessageParserEarlyAdoption: false,
				alsoSendThreadToChannel: 'default',
				settings: {
					preferences: {
						convertAsciiEmoji,
						enableMobileRinging
					}
				}
			}
		},
		server: {
			version: '6.10.0'
		}
	});

	const renderWithPreferences = (preferences: { convertAsciiEmoji: boolean; enableMobileRinging: boolean }) => {
		(useAppSelector as jest.Mock).mockImplementation((selector: (state: any) => unknown) => selector(mockState(preferences)));
		return render(<UserPreferencesView navigation={navigation as any} />);
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useDispatch as jest.Mock).mockReturnValue(dispatch);
		(saveUserPreferences as jest.Mock).mockResolvedValue(undefined);
	});

	it('keeps enableMobileRinging enabled while enabling convertAsciiEmoji', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: true });

		fireEvent(getByTestId('preferences-view-convert-ascii-to-emoji'), 'valueChange', true);

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: true,
			enableMobileRinging: true
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ convertAsciiEmoji: true }));
	});

	it('keeps enableMobileRinging disabled while disabling convertAsciiEmoji', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: true, enableMobileRinging: false });

		fireEvent(getByTestId('preferences-view-convert-ascii-to-emoji'), 'valueChange', false);

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: false,
			enableMobileRinging: false
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ convertAsciiEmoji: false }));
	});

	it('keeps convertAsciiEmoji enabled while enabling enableMobileRinging', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: true, enableMobileRinging: false });

		fireEvent(getByTestId('preferences-view-enable-mobile-ringing'), 'valueChange', true);

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: true,
			enableMobileRinging: true
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ enableMobileRinging: true }));
	});

	it('keeps convertAsciiEmoji disabled while disabling enableMobileRinging', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: true });

		fireEvent(getByTestId('preferences-view-enable-mobile-ringing'), 'valueChange', false);

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: false,
			enableMobileRinging: false
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ enableMobileRinging: false }));
	});
});

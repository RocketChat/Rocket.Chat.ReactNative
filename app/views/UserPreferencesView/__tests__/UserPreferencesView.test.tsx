import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useDispatch } from 'react-redux';

import UserPreferencesView from '..';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { saveUserPreferences } from '~/lib/services/restApi';
import NativeWatchModule from '~/lib/native/NativeWatchModule';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn()
}));

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	saveUserPreferences: jest.fn()
}));

jest.mock('../ListPicker', () => () => null);

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
		jest.mocked(NativeWatchModule!.isWatchAppInstalled).mockReturnValue(false);
	});

	it('keeps enableMobileRinging enabled while enabling convertAsciiEmoji', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: true });

		fireEvent(getByTestId('preferences-view-convert-ascii-to-emoji'), 'isOnChange', { nativeEvent: { isOn: true } });

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: true,
			enableMobileRinging: true
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ convertAsciiEmoji: true }));
	});

	it('keeps enableMobileRinging disabled while disabling convertAsciiEmoji', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: true, enableMobileRinging: false });

		fireEvent(getByTestId('preferences-view-convert-ascii-to-emoji'), 'isOnChange', { nativeEvent: { isOn: false } });

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: false,
			enableMobileRinging: false
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ convertAsciiEmoji: false }));
	});

	it('keeps convertAsciiEmoji enabled while enabling enableMobileRinging', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: true, enableMobileRinging: false });

		fireEvent(getByTestId('preferences-view-enable-mobile-ringing'), 'isOnChange', { nativeEvent: { isOn: true } });

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: true,
			enableMobileRinging: true
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ enableMobileRinging: true }));
	});

	it('keeps convertAsciiEmoji disabled while disabling enableMobileRinging', async () => {
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: true });

		fireEvent(getByTestId('preferences-view-enable-mobile-ringing'), 'isOnChange', { nativeEvent: { isOn: false } });

		const dispatchedUser = dispatch.mock.calls[0][0].user;
		expect(dispatchedUser.settings.preferences).toEqual({
			convertAsciiEmoji: false,
			enableMobileRinging: false
		});
		await waitFor(() => expect(saveUserPreferences).toHaveBeenCalledWith({ enableMobileRinging: false }));
	});

	it('shows the Apple Watch quick replies row when the watch app is installed', () => {
		jest.mocked(NativeWatchModule!.isWatchAppInstalled).mockReturnValue(true);
		const { getByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: false });

		fireEvent.press(getByTestId('preferences-view-watchos-quickreplies'));

		expect(navigation.navigate).toHaveBeenCalledWith('UserWatchOSQuickRepliesView');
	});

	it('hides the Apple Watch quick replies row without the watch app', () => {
		const { queryByTestId } = renderWithPreferences({ convertAsciiEmoji: false, enableMobileRinging: false });

		expect(queryByTestId('preferences-view-watchos-quickreplies')).toBeNull();
	});
});

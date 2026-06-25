import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ScreenLockConfigView from './ScreenLockConfigView';
import { BIOMETRY_ENABLED_KEY, DEFAULT_AUTO_LOCK } from '../lib/constants/localAuthentication';

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ setOptions: mockSetOptions })
}));

jest.mock('../theme', () => ({
	useTheme: () => ({ theme: 'light', colors: {} })
}));

jest.mock('../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) =>
		selector({
			server: { server: 'srv' },
			settings: { Force_Screen_Lock: false, Force_Screen_Lock_After: 0 }
		})
}));

const update = jest.fn(cb => cb({ autoLock: false, autoLockTime: null }));
const fakeRecord = { autoLock: false, autoLockTime: null, update };

const mockWrite = jest.fn(fn => fn());
const mockFind = jest.fn(() => Promise.resolve(fakeRecord));

jest.mock('../lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: () => ({ find: mockFind }),
			write: (fn: () => Promise<void>) => mockWrite(fn)
		}
	}
}));

const mockSupportedBiometryLabel = jest.fn(() => Promise.resolve('Face ID'));
const mockCheckHasPasscode = jest.fn();

jest.mock('../lib/methods/helpers/localAuthentication', () => ({
	supportedBiometryLabel: () => mockSupportedBiometryLabel(),
	checkHasPasscode: (args: any) => mockCheckHasPasscode(args),
	changePasscode: jest.fn(),
	handleLocalAuthentication: jest.fn()
}));

const mockGetBool = jest.fn((_key: string) => false as boolean | null);
const mockSetBool = jest.fn((_key: string, _value: boolean) => {});

jest.mock('../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: (key: string) => mockGetBool(key),
		setBool: (key: string, value: boolean) => mockSetBool(key, value)
	}
}));

jest.mock('../lib/methods/helpers/log', () => ({
	events: {
		SLC_SAVE_SCREEN_LOCK: 'SLC_SAVE_SCREEN_LOCK',
		SLC_TOGGLE_AUTOLOCK: 'SLC_TOGGLE_AUTOLOCK',
		SLC_TOGGLE_BIOMETRY: 'SLC_TOGGLE_BIOMETRY',
		SLC_CHANGE_AUTOLOCK_TIME: 'SLC_CHANGE_AUTOLOCK_TIME',
		SLC_CHANGE_PASSCODE: 'SLC_CHANGE_PASSCODE'
	},
	logEvent: jest.fn()
}));

jest.mock('../containers/SafeAreaView', () => {
	const { View } = require('react-native');
	return ({ children }: any) => <View>{children}</View>;
});

describe('ScreenLockConfigView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFind.mockResolvedValue(fakeRecord);
		mockSupportedBiometryLabel.mockResolvedValue('Face ID');
		mockGetBool.mockReturnValue(false);
	});

	it('renders the auto-lock list item after init', async () => {
		const { findByText } = render(<ScreenLockConfigView />);

		await findByText('Unlock with passcode');
	});

	it('enable auto-lock persists true — stale-state guard', async () => {
		mockCheckHasPasscode.mockResolvedValue(undefined);

		const { findByTestId } = render(<ScreenLockConfigView />);
		const autoLockSwitch = await findByTestId('screen-lock-config-auto-lock-switch');
		fireEvent(autoLockSwitch, 'onValueChange', true);

		await waitFor(() => expect(mockWrite).toHaveBeenCalled());

		expect(update).toHaveBeenCalled();
		const recordArg: any = {};
		const cb = update.mock.calls[update.mock.calls.length - 1][0];
		cb(recordArg);
		expect(recordArg.autoLock).toBe(true);
		expect(recordArg.autoLockTime).toBe(DEFAULT_AUTO_LOCK);
	});

	it('passcode-cancel undo — ends with autoLock false persisted', async () => {
		mockCheckHasPasscode.mockRejectedValue(new Error('cancelled'));

		const { findByTestId } = render(<ScreenLockConfigView />);
		const autoLockSwitch = await findByTestId('screen-lock-config-auto-lock-switch');
		fireEvent(autoLockSwitch, 'onValueChange', true);

		await waitFor(() => expect(mockWrite).toHaveBeenCalled());

		expect(update).toHaveBeenCalled();
		const recordArg: any = {};
		const cb = update.mock.calls[update.mock.calls.length - 1][0];
		cb(recordArg);
		expect(recordArg.autoLock).toBe(false);
		expect(recordArg.autoLockTime).toBe(DEFAULT_AUTO_LOCK);
	});

	it('toggle biometry calls userPreferences.setBool with flipped value', async () => {
		mockCheckHasPasscode.mockResolvedValue(undefined);

		const { findByTestId } = render(<ScreenLockConfigView />);
		const autoLockSwitch = await findByTestId('screen-lock-config-auto-lock-switch');
		fireEvent(autoLockSwitch, 'onValueChange', true);
		await waitFor(() => expect(mockWrite).toHaveBeenCalled());

		mockWrite.mockClear();

		const biometrySwitch = await findByTestId('screen-lock-config-biometry-switch');
		fireEvent(biometrySwitch, 'onValueChange', true);

		await waitFor(() => expect(mockSetBool).toHaveBeenCalledWith(BIOMETRY_ENABLED_KEY, true));
	});

	it('change auto-lock time persists selected value with current autoLock', async () => {
		mockCheckHasPasscode.mockResolvedValue(undefined);

		const { findByTestId, findByText } = render(<ScreenLockConfigView />);
		const autoLockSwitch = await findByTestId('screen-lock-config-auto-lock-switch');
		fireEvent(autoLockSwitch, 'onValueChange', true);
		await waitFor(() => expect(mockWrite).toHaveBeenCalled());

		mockWrite.mockClear();
		update.mockClear();

		const timeOption = await findByText('After 1 minute');
		fireEvent.press(timeOption.parent!);

		await waitFor(() => expect(mockWrite).toHaveBeenCalled());

		expect(update).toHaveBeenCalled();
		const recordArg: any = {};
		const cb = update.mock.calls[update.mock.calls.length - 1][0];
		cb(recordArg);
		expect(recordArg.autoLockTime).toBe(60);
	});
});

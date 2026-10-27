import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ScreenLockConfigView from '..';
import Switch from '~/containers/Switch';
import { DEFAULT_AUTO_LOCK } from '~/lib/constants/localAuthentication';
import { UserCanceledError } from '~/lib/methods/helpers/localAuthentication';

const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ setOptions: mockSetOptions })
}));

let mockSettings = { Force_Screen_Lock: false, Force_Screen_Lock_After: 0 };

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: unknown) => unknown) => selector({ server: { server: 'srv' }, settings: mockSettings })
}));

interface IFakeServerRecord {
	autoLock: boolean;
	autoLockTime: number | null;
	update: jest.Mock;
}

const persisted: Partial<IFakeServerRecord> = {};
const mockUpdate = jest.fn((apply: (record: Partial<IFakeServerRecord>) => void) => apply(persisted));
let mockServerRecord: IFakeServerRecord;

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: () => ({ find: () => Promise.resolve(mockServerRecord) }),
			write: (writer: () => Promise<void>) => writer()
		}
	}
}));

const mockCheckHasPasscode = jest.fn();
const mockChangePasscode = jest.fn();
const mockHandleLocalAuthentication = jest.fn();
const mockEnableBiometry = jest.fn();

jest.mock('~/lib/methods/helpers/localAuthentication', () => {
	class MockUserCanceledError extends Error {}
	return {
		UserCanceledError: MockUserCanceledError,
		supportedBiometryLabel: () => Promise.resolve('Face ID'),
		checkHasPasscode: (args: unknown) => mockCheckHasPasscode(args),
		changePasscode: (args: unknown) => mockChangePasscode(args),
		handleLocalAuthentication: (args: unknown) => mockHandleLocalAuthentication(args),
		enableBiometry: () => mockEnableBiometry(),
		logUnlessUserCanceled: jest.fn()
	};
});

const mockIsEnabled = jest.fn(() => false);
const mockDisableBiometry = jest.fn(() => Promise.resolve());

jest.mock('~/lib/biometricTrustStore', () => ({
	biometricTrustStore: {
		isEnabled: () => mockIsEnabled(),
		disableBiometry: () => mockDisableBiometry()
	}
}));

const mockShowErrorAlert = jest.fn();

jest.mock('~/lib/methods/helpers/info', () => ({
	showErrorAlert: (...args: unknown[]) => mockShowErrorAlert(...args)
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	events: {},
	logEvent: jest.fn()
}));

jest.mock('~/containers/SafeAreaView', () => {
	const { View } = require('react-native');
	return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

const renderView = async () => {
	render(<ScreenLockConfigView />);
	await screen.findByText('Unlock with passcode');
};

const switchById = (testID: string) => {
	const found = screen.UNSAFE_getAllByType(Switch).find(element => element.props.testID === testID);
	if (!found) {
		throw new Error(`No Switch with testID ${testID}`);
	}
	return found;
};
const autoLockSwitch = () => switchById('screen-lock-config-view-auto-lock-switch');
const biometrySwitch = () => switchById('screen-lock-config-view-biometry-switch');

const enableAutoLock = async () => {
	fireEvent(autoLockSwitch(), 'onValueChange', true);
	await waitFor(() => expect(persisted.autoLock).toBe(true));
};

describe('ScreenLockConfigView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSettings = { Force_Screen_Lock: false, Force_Screen_Lock_After: 0 };
		mockServerRecord = { autoLock: false, autoLockTime: null, update: mockUpdate };
		Object.keys(persisted).forEach(key => delete persisted[key as keyof IFakeServerRecord]);
		mockCheckHasPasscode.mockResolvedValue(undefined);
		mockEnableBiometry.mockResolvedValue({ kind: 'success' });
		mockIsEnabled.mockReturnValue(false);
	});

	it('sets the header title', async () => {
		await renderView();

		expect(mockSetOptions).toHaveBeenCalledWith({ title: 'Screen lock' });
	});

	it('persists auto-lock on with the default time once a passcode exists', async () => {
		await renderView();
		await enableAutoLock();

		expect(mockCheckHasPasscode).toHaveBeenCalledWith({ force: false });
		expect(persisted.autoLockTime).toBe(DEFAULT_AUTO_LOCK);
		expect(screen.getByText('After 1 minute')).toBeTruthy();
	});

	it('persists auto-lock off when passcode creation is canceled', async () => {
		mockCheckHasPasscode.mockRejectedValue(new UserCanceledError());
		await renderView();

		fireEvent(autoLockSwitch(), 'onValueChange', true);

		await waitFor(() => expect(persisted.autoLock).toBe(false));
		expect(mockUpdate).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('After 1 minute')).toBeNull();
	});

	it('applies a switch change and a row press from the same tap once', async () => {
		await renderView();

		await act(async () => {
			fireEvent(autoLockSwitch(), 'onValueChange', true);
			fireEvent.press(screen.getByTestId('screen-lock-config-view-auto-lock'));
		});

		await waitFor(() => expect(persisted.autoLock).toBe(true));
		expect(mockCheckHasPasscode).toHaveBeenCalledTimes(1);
		expect(mockUpdate).toHaveBeenCalledTimes(1);
	});

	it('persists the selected auto-lock time', async () => {
		await renderView();
		await enableAutoLock();

		fireEvent.press(screen.getByTestId('screen-lock-config-view-auto-lock-time-60'));

		await waitFor(() => expect(persisted.autoLockTime).toBe(60));
		expect(persisted.autoLock).toBe(true);
	});

	it('enables biometry through the consent flow', async () => {
		await renderView();
		await enableAutoLock();

		fireEvent(biometrySwitch(), 'onValueChange', true);

		await waitFor(() => expect(mockEnableBiometry).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(biometrySwitch().props.value).toBe(true));
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('turns biometry back off and alerts when the device cannot use it', async () => {
		mockEnableBiometry.mockResolvedValue({ kind: 'unavailable' });
		await renderView();
		await enableAutoLock();

		fireEvent(biometrySwitch(), 'onValueChange', true);

		await waitFor(() => expect(mockShowErrorAlert).toHaveBeenCalledTimes(1));
		expect(biometrySwitch().props.value).toBe(false);
	});

	it('turns biometry back off silently when consent is canceled', async () => {
		mockEnableBiometry.mockResolvedValue({ kind: 'canceled' });
		await renderView();
		await enableAutoLock();

		fireEvent(biometrySwitch(), 'onValueChange', true);

		await waitFor(() => expect(mockEnableBiometry).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(biometrySwitch().props.value).toBe(false));
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('disables biometry when it is switched off', async () => {
		mockIsEnabled.mockReturnValue(true);
		await renderView();
		await enableAutoLock();

		fireEvent(biometrySwitch(), 'onValueChange', false);

		await waitFor(() => expect(mockDisableBiometry).toHaveBeenCalledTimes(1));
		expect(mockEnableBiometry).not.toHaveBeenCalled();
	});

	it('asks for the current passcode before changing it', async () => {
		mockServerRecord = { autoLock: true, autoLockTime: 60, update: mockUpdate };
		await renderView();

		fireEvent.press(await screen.findByTestId('screen-lock-config-view-change-passcode'));

		await waitFor(() => expect(mockChangePasscode).toHaveBeenCalledWith({ force: false }));
		expect(mockHandleLocalAuthentication).toHaveBeenCalledWith({ canCloseModal: true });
	});

	it('keeps the passcode when the current-passcode prompt is canceled', async () => {
		mockServerRecord = { autoLock: true, autoLockTime: 60, update: mockUpdate };
		mockHandleLocalAuthentication.mockRejectedValue(new UserCanceledError());
		await renderView();

		fireEvent.press(await screen.findByTestId('screen-lock-config-view-change-passcode'));

		await waitFor(() => expect(mockHandleLocalAuthentication).toHaveBeenCalledTimes(1));
		expect(mockChangePasscode).not.toHaveBeenCalled();
	});

	it('shows only the admin-forced time and locks the switch when the admin forces screen lock', async () => {
		mockSettings = { Force_Screen_Lock: true, Force_Screen_Lock_After: 120 };
		mockServerRecord = { autoLock: true, autoLockTime: 120, update: mockUpdate };
		await renderView();

		expect(await screen.findByText('After 120 seconds (set by admin)')).toBeTruthy();
		expect(screen.queryByText('After 1 minute')).toBeNull();
		expect(autoLockSwitch().props.disabled).toBe(true);
	});

	it('offers an admin time that is not a default option once forcing is lifted', async () => {
		mockSettings = { Force_Screen_Lock: false, Force_Screen_Lock_After: 120 };
		mockServerRecord = { autoLock: true, autoLockTime: 120, update: mockUpdate };
		await renderView();

		expect(await screen.findByText('After 120 seconds (set by admin)')).toBeTruthy();
		expect(screen.getByText('After 1 minute')).toBeTruthy();
	});
});

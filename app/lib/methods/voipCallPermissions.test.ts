import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { PermissionStatus } from 'expo-camera';

import log from './helpers/log';
import {
	hasVoipCallPermission,
	preAcquireVoipMicPermission,
	requestVoipCallPermissions,
	showVoipMicrophoneDeniedAlert
} from './voipCallPermissions';

const mockIsInActiveVoipCall = jest.fn(() => false);
jest.mock('../services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: () => mockIsInActiveVoipCall()
}));

jest.mock('expo-av', () => ({
	Audio: {
		getPermissionsAsync: jest.fn(),
		requestPermissionsAsync: jest.fn()
	}
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key }
}));

jest.mock('./helpers/openAppSettings', () => ({
	openAppSettings: jest.fn()
}));

describe('requestVoipCallPermissions', () => {
	beforeEach(() => {
		Platform.OS = 'ios';
		jest.resetAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns granted on non-Android without prompting when already granted', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: true,
			status: PermissionStatus.GRANTED,
			canAskAgain: true,
			expires: 'never'
		});

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: true, canAskAgain: true, prompted: false });
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('requests microphone permission on iOS when undetermined', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.UNDETERMINED,
			canAskAgain: true,
			expires: 'never'
		});
		jest.mocked(Audio.requestPermissionsAsync).mockResolvedValue({
			granted: true,
			status: PermissionStatus.GRANTED,
			canAskAgain: true,
			expires: 'never'
		});

		const result = await requestVoipCallPermissions();

		expect(Audio.requestPermissionsAsync).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ granted: true, canAskAgain: true, prompted: true });
	});

	it('returns denied with canAskAgain false on iOS when permanently denied', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: false, prompted: false });
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('requests only RECORD_AUDIO on Android', async () => {
		Platform.OS = 'android';
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: true, canAskAgain: true, prompted: false });
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
	});

	it('returns denied when RECORD_AUDIO is denied', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: true, prompted: true });
	});

	it('returns denied with canAskAgain false when RECORD_AUDIO is never ask again', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: false, prompted: false });
	});

	it('resolves to denied without rejecting when the Android permission request throws', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'request').mockRejectedValue(new Error('Not attached to an Activity'));

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: true, prompted: false });
		expect(log).toHaveBeenCalledTimes(1);
	});

	it('resolves to denied without rejecting when the iOS permission check throws', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockRejectedValue(new Error('permission service unavailable'));

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: true, prompted: false });
		expect(log).toHaveBeenCalledTimes(1);
	});

	it('returns denied on iOS when the live prompt is declined', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.UNDETERMINED,
			canAskAgain: true,
			expires: 'never'
		});
		jest.mocked(Audio.requestPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		const result = await requestVoipCallPermissions();

		expect(Audio.requestPermissionsAsync).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ granted: false, canAskAgain: false, prompted: true });
	});
});

describe('hasVoipCallPermission (check-only — the incoming answer gate)', () => {
	beforeEach(() => {
		Platform.OS = 'ios';
		jest.resetAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns true on iOS when the microphone is granted, without prompting', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: true,
			status: PermissionStatus.GRANTED,
			canAskAgain: true,
			expires: 'never'
		});

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(true);
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('returns false on iOS when denied, without prompting', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(false);
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('returns false on iOS when undetermined, without prompting', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.UNDETERMINED,
			canAskAgain: true,
			expires: 'never'
		});

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(false);
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('checks RECORD_AUDIO on Android without requesting', async () => {
		Platform.OS = 'android';
		const checkSpy = jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
		const requestSpy = jest.spyOn(PermissionsAndroid, 'request');

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(true);
		expect(checkSpy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
		expect(requestSpy).not.toHaveBeenCalled();
	});

	it('returns false on Android when RECORD_AUDIO is not granted', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(false);
	});

	it('resolves to false without rejecting when the check throws', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockRejectedValue(new Error('permission service unavailable'));

		const granted = await hasVoipCallPermission();

		expect(granted).toBe(false);
		expect(log).toHaveBeenCalledTimes(1);
	});
});

describe('showVoipMicrophoneDeniedAlert', () => {
	beforeEach(() => {
		Platform.OS = 'ios';
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('shows dismiss-only alert when permission can be requested again', () => {
		showVoipMicrophoneDeniedAlert(true);

		expect(Alert.alert).toHaveBeenCalledWith(
			'Microphone_access_needed_for_voice_calls',
			'Go_to_your_device_settings_and_allow_microphone',
			[{ text: 'Ok' }],
			{ cancelable: true }
		);
	});

	it('shows settings alert when permission is permanently denied', () => {
		showVoipMicrophoneDeniedAlert(false);

		expect(Alert.alert).toHaveBeenCalledWith(
			'Microphone_access_needed_for_voice_calls',
			'Go_to_your_device_settings_and_allow_microphone',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Settings', onPress: expect.any(Function) }
			],
			{ cancelable: false }
		);
	});
});

describe('preAcquireVoipMicPermission (pre-acquire at session init)', () => {
	beforeEach(() => {
		Platform.OS = 'ios';
		jest.resetAllMocks();
		mockIsInActiveVoipCall.mockReturnValue(false);
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not request or alert when a call is already active or being reconciled', async () => {
		mockIsInActiveVoipCall.mockReturnValue(true);

		await preAcquireVoipMicPermission();

		expect(Audio.getPermissionsAsync).not.toHaveBeenCalled();
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('requests but does not alert when the microphone is granted', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: true,
			status: PermissionStatus.GRANTED,
			canAskAgain: true,
			expires: 'never'
		});

		await preAcquireVoipMicPermission();

		expect(Alert.alert).not.toHaveBeenCalled();
	});

	it('shows the denied alert on a fresh denial (undetermined → denied)', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.UNDETERMINED,
			canAskAgain: true,
			expires: 'never'
		});
		jest.mocked(Audio.requestPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		await preAcquireVoipMicPermission();

		expect(Alert.alert).toHaveBeenCalledTimes(1);
	});

	it('does not alert when the mic was already denied and no dialog is shown', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		await preAcquireVoipMicPermission();

		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
		expect(Alert.alert).not.toHaveBeenCalled();
	});
});

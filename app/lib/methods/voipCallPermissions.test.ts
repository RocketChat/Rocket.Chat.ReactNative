import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { PermissionStatus } from 'expo-camera';

import { requestVoipCallPermissions, showVoipMicrophoneDeniedAlert } from './voipCallPermissions';

jest.mock('expo-av', () => ({
	Audio: {
		getPermissionsAsync: jest.fn(),
		requestPermissionsAsync: jest.fn()
	}
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
		jest.clearAllMocks();
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

		expect(result).toEqual({ granted: true, canAskAgain: true });
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
		expect(result).toEqual({ granted: true, canAskAgain: true });
	});

	it('returns denied with canAskAgain false on iOS when permanently denied', async () => {
		jest.mocked(Audio.getPermissionsAsync).mockResolvedValue({
			granted: false,
			status: PermissionStatus.DENIED,
			canAskAgain: false,
			expires: 'never'
		});

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: false });
		expect(Audio.requestPermissionsAsync).not.toHaveBeenCalled();
	});

	it('requests only RECORD_AUDIO on Android', async () => {
		Platform.OS = 'android';
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: true, canAskAgain: true });
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
	});

	it('returns denied when RECORD_AUDIO is denied', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: true });
	});

	it('returns denied with canAskAgain false when RECORD_AUDIO is never ask again', async () => {
		Platform.OS = 'android';
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

		const result = await requestVoipCallPermissions();

		expect(result).toEqual({ granted: false, canAskAgain: false });
	});
});

describe('showVoipMicrophoneDeniedAlert', () => {
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('shows dismiss-only alert when permission can be requested again', () => {
		showVoipMicrophoneDeniedAlert(true);

		expect(Alert.alert).toHaveBeenCalledWith(
			'Microphone_access_needed_to_record_audio',
			'Go_to_your_device_settings_and_allow_microphone',
			[{ text: 'Ok' }],
			{ cancelable: true }
		);
	});

	it('shows settings alert when permission is permanently denied', () => {
		showVoipMicrophoneDeniedAlert(false);

		expect(Alert.alert).toHaveBeenCalledWith(
			'Microphone_access_needed_to_record_audio',
			'Go_to_your_device_settings_and_allow_microphone',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Settings', onPress: expect.any(Function) }
			],
			{ cancelable: false }
		);
	});
});

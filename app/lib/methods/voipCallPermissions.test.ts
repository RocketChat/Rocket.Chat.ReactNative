import { PermissionsAndroid, Platform } from 'react-native';

describe('requestVoipCallPermissions', () => {
	const platformVersion = Platform.Version;

	const setApiLevel = (apiLevel: number | string) => {
		Object.defineProperty(Platform, 'Version', { value: apiLevel, configurable: true });
	};

	afterEach(() => {
		Object.defineProperty(Platform, 'Version', { value: platformVersion, configurable: true });
		jest.restoreAllMocks();
	});

	it('returns true on non-Android without prompting', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: false
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	it('requests only RECORD_AUDIO on Android', async () => {
		jest.resetModules();
		setApiLevel(30);
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
		expect(spy).not.toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
	});

	it('also requests BLUETOOTH_CONNECT for BT headsets on API 31+', async () => {
		jest.resetModules();
		setApiLevel(34);
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
	});

	it('still joins when the BT grant is denied', async () => {
		jest.resetModules();
		setApiLevel(34);
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		jest
			.spyOn(PermissionsAndroid, 'request')
			.mockImplementation((permission?: string) =>
				Promise.resolve(
					permission === PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
						? PermissionsAndroid.RESULTS.DENIED
						: PermissionsAndroid.RESULTS.GRANTED
				)
			);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
	});

	it('returns false when RECORD_AUDIO is denied', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(false);
	});

	it('returns false when RECORD_AUDIO is set to never ask again', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(false);
	});
});

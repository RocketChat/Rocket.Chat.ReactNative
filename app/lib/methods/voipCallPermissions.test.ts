import { PermissionsAndroid } from 'react-native';

describe('requestVoipCallPermissions', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns true on non-Android without prompting', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: false
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({} as never);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	it('requests both READ_PHONE_STATE and RECORD_AUDIO on Android', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
			[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE]: PermissionsAndroid.RESULTS.GRANTED,
			[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.GRANTED
		} as never);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).toHaveBeenCalledWith([
			PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
			PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
		]);
	});

	it('returns false when RECORD_AUDIO is denied', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
			[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE]: PermissionsAndroid.RESULTS.GRANTED,
			[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.DENIED
		} as never);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(false);
	});

	it('returns true when READ_PHONE_STATE is denied but RECORD_AUDIO is granted', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
			[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE]: PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
			[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.GRANTED
		} as never);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
	});
});

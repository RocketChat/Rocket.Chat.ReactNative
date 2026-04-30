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
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).not.toHaveBeenCalled();
	});

	it('requests only RECORD_AUDIO on Android', async () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const { requestVoipCallPermissions } = require('./voipCallPermissions');

		const granted = await requestVoipCallPermissions();

		expect(granted).toBe(true);
		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
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

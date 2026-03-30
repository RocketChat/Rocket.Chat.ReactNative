import { PermissionsAndroid } from 'react-native';

describe('requestPhoneStatePermission', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not call PermissionsAndroid.request when not on Android', () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual<typeof import('./helpers')>('./helpers'),
			isAndroid: false
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();

		expect(spy).not.toHaveBeenCalled();
	});

	it('requests READ_PHONE_STATE on Android with i18n rationale keys', () => {
		jest.resetModules();
		jest.doMock('../../i18n', () => ({
			__esModule: true,
			default: { t: (key: string) => key }
		}));
		jest.doMock('./helpers', () => ({
			...jest.requireActual<typeof import('./helpers')>('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();

		expect(spy).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
			buttonPositive: 'Ok',
			message: 'Phone_state_permission_message',
			title: 'Phone_state_permission_title'
		});
	});

	it('does not prompt again in the same session on Android', () => {
		jest.resetModules();
		jest.doMock('../../i18n', () => ({
			__esModule: true,
			default: { t: (key: string) => key }
		}));
		jest.doMock('./helpers', () => ({
			...jest.requireActual<typeof import('./helpers')>('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();
		requestPhoneStatePermission();

		expect(spy).toHaveBeenCalledTimes(1);
	});
});

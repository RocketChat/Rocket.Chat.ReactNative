import { PermissionsAndroid } from 'react-native';

describe('requestPhoneStatePermission', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('does not call PermissionsAndroid.request when not on Android', () => {
		jest.resetModules();
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: false
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();

		expect(spy).not.toHaveBeenCalled();
	});

	it('requests READ_PHONE_STATE on Android with i18n rationale keys', () => {
		jest.resetModules();
		const mockT = jest.fn((key: string) => key);
		jest.doMock('../../i18n', () => ({
			__esModule: true,
			default: { t: mockT }
		}));
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();

		expect(mockT).toHaveBeenCalledWith('Ok');
		expect(mockT).toHaveBeenCalledWith('Phone_state_permission_message');
		expect(mockT).toHaveBeenCalledWith('Phone_state_permission_title');
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
			default: { t: jest.fn((key: string) => key) }
		}));
		jest.doMock('./helpers', () => ({
			...jest.requireActual('./helpers'),
			isAndroid: true
		}));
		const spy = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted' as never);
		const { requestPhoneStatePermission } = require('./voipPhoneStatePermission');

		requestPhoneStatePermission();
		requestPhoneStatePermission();

		expect(spy).toHaveBeenCalledTimes(1);
	});
});

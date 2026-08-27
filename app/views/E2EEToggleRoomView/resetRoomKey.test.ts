import { Alert } from 'react-native';

import { Encryption } from '../../lib/encryption';
import log from '../../lib/methods/helpers/log';
import { showToast } from '../../lib/methods/helpers/showToast';
import { e2eResetRoomKey } from '../../lib/services/restApi';
import { TwoFactorCancelledError } from '../../lib/services/twoFactor/twoFactorCancelled';
import { resetRoomKey } from './resetRoomKey';

jest.mock('../../i18n', () => ({
	t: (key: string) => key,
	isTranslated: () => true
}));

jest.mock('../../lib/encryption', () => ({
	Encryption: { getRoomInstance: jest.fn() }
}));

jest.mock('../../lib/methods/helpers/log', () => jest.fn());

jest.mock('../../lib/methods/helpers/showToast', () => ({
	showToast: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	e2eResetRoomKey: jest.fn()
}));

const roomKey = { e2eKey: 'key', e2eKeyId: 'key-id' };

const mockRoom = (resetRoomKeyImplementation: jest.Mock) => {
	(Encryption.getRoomInstance as jest.Mock).mockResolvedValue({ resetRoomKey: resetRoomKeyImplementation });
};

const confirm = () => {
	const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
	return buttons[1].onPress();
};

describe('resetRoomKey', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, 'alert').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('confirms the reset when every step completes', async () => {
		mockRoom(jest.fn().mockResolvedValue(roomKey));
		(e2eResetRoomKey as jest.Mock).mockResolvedValue({ success: true });

		resetRoomKey('rid');
		await confirm();

		expect(showToast).toHaveBeenCalledWith('Encryption_keys_reset');
	});

	it('shows no error when the local key reset is cancelled', async () => {
		mockRoom(jest.fn().mockRejectedValue(new TwoFactorCancelledError()));

		resetRoomKey('rid');
		await confirm();

		expect(showToast).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('shows no error when looking the room up is cancelled', async () => {
		(Encryption.getRoomInstance as jest.Mock).mockRejectedValue(new TwoFactorCancelledError());

		resetRoomKey('rid');
		await confirm();

		expect(showToast).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('shows no error when the server reset is cancelled', async () => {
		mockRoom(jest.fn().mockResolvedValue(roomKey));
		(e2eResetRoomKey as jest.Mock).mockRejectedValue(new TwoFactorCancelledError());

		resetRoomKey('rid');
		await confirm();

		expect(showToast).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('still reports a genuine failure', async () => {
		mockRoom(jest.fn().mockResolvedValue(roomKey));
		(e2eResetRoomKey as jest.Mock).mockRejectedValue(new Error('boom'));

		resetRoomKey('rid');
		await confirm();

		expect(log).toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith('Encryption_keys_failed');
	});
});

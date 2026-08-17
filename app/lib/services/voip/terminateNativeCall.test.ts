import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';
import { terminateNativeCall } from './terminateNativeCall';

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		disconnectNativeCall: jest.fn(),
		stopVoipCallService: jest.fn()
	}
}));

describe('terminateNativeCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Platform.OS = 'android';
	});

	it('disconnects the Telecom connection natively so teardown does not depend on CallKeep setup', () => {
		terminateNativeCall('call-1');

		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-1');
		expect(NativeVoipModule.disconnectNativeCall).toHaveBeenCalledWith('call-1');
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalled();
	});

	it('still disconnects natively when RNCallKeep.endCall throws', () => {
		(RNCallKeep.endCall as jest.Mock).mockImplementationOnce(() => {
			throw new Error('CallKeep unavailable');
		});

		terminateNativeCall('call-2');

		expect(NativeVoipModule.disconnectNativeCall).toHaveBeenCalledWith('call-2');
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalled();
	});

	it('still stops the foreground service when the native disconnect throws', () => {
		(NativeVoipModule.disconnectNativeCall as jest.Mock).mockImplementationOnce(() => {
			throw new Error('bridge unavailable');
		});

		terminateNativeCall('call-3');

		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalled();
	});

	it('does not touch the Android natives on iOS', () => {
		Platform.OS = 'ios';

		terminateNativeCall('call-4');

		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-4');
		expect(NativeVoipModule.disconnectNativeCall).not.toHaveBeenCalled();
		expect(NativeVoipModule.stopVoipCallService).not.toHaveBeenCalled();
	});
});

import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';
import { resetTerminateNativeCallForTesting, terminateNativeCall } from './terminateNativeCall';

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
		resetTerminateNativeCallForTesting();
		Platform.OS = 'android';
	});

	it('disconnects the Telecom connection natively so teardown does not depend on CallKeep setup', () => {
		terminateNativeCall('call-1');

		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-1');
		expect(NativeVoipModule.disconnectNativeCall).toHaveBeenCalledWith('call-1');
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalled();
	});

	it('disconnects natively before RNCallKeep.endCall removes the connection', () => {
		const order: string[] = [];
		(NativeVoipModule.disconnectNativeCall as jest.Mock).mockImplementationOnce(() => order.push('native'));
		(RNCallKeep.endCall as jest.Mock).mockImplementationOnce(() => order.push('callkeep'));

		terminateNativeCall('call-order');

		expect(order).toEqual(['native', 'callkeep']);
	});

	it('ignores repeat invocations for the same callId', () => {
		terminateNativeCall('call-dup');
		terminateNativeCall('call-dup');

		expect(RNCallKeep.endCall).toHaveBeenCalledTimes(1);
		expect(NativeVoipModule.disconnectNativeCall).toHaveBeenCalledTimes(1);
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalledTimes(1);
	});

	it('still terminates a different callId after one was already terminated', () => {
		terminateNativeCall('call-a');
		terminateNativeCall('call-b');

		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-a');
		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-b');
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalledTimes(2);
	});

	it('still calls RNCallKeep.endCall when the native disconnect throws', () => {
		(NativeVoipModule.disconnectNativeCall as jest.Mock).mockImplementationOnce(() => {
			throw new Error('bridge unavailable');
		});

		terminateNativeCall('call-2');

		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-2');
		expect(NativeVoipModule.stopVoipCallService).toHaveBeenCalled();
	});

	it('still stops the foreground service when RNCallKeep.endCall throws', () => {
		(RNCallKeep.endCall as jest.Mock).mockImplementationOnce(() => {
			throw new Error('CallKeep unavailable');
		});

		terminateNativeCall('call-3');

		expect(NativeVoipModule.disconnectNativeCall).toHaveBeenCalledWith('call-3');
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

/**
 * @providesModule JitsiMeet
 */

import {
	DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform
} from 'react-native';

const { JitsiMeetRN } = NativeModules;
export const JitsiMeetEvents = Platform.select({
	ios: new NativeEventEmitter(JitsiMeetRN),
	android: DeviceEventEmitter
});
export default JitsiMeetRN;

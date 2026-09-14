import { PermissionsAndroid, Platform } from 'react-native';

import { isAndroid } from './helpers';

export const requestVoipCallPermissions = async (): Promise<boolean> => {
	if (!isAndroid) {
		return true;
	}
	const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
	// WebRTC audio in the conference WebView still routes via the OS audio manager, so a BT
	// headset needs BLUETOOTH_CONNECT on API 31+. Fire-and-forget: a denial must not block
	// the call, the speaker still works.
	// ponytail: no Web Bluetooth API in react-native-webview — this is audio routing only, not BLE pairing.
	if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
		try {
			await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
		} catch {
			// Ignored — the call proceeds without BT audio.
		}
	}
	return result === PermissionsAndroid.RESULTS.GRANTED;
};

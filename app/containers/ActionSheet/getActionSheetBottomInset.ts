import { Platform } from 'react-native';

import { isAndroid, isIOS } from '../../lib/methods/helpers';

// Android API level (SDK_INT) at which edge-to-edge is enforced and TrueSheet
// auto-reserves the navigation-bar inset itself. At or above this level we let
// native handle it and return 0; below it we rely on the live safe-area inset.
const TRUE_SHEET_EDGE_TO_EDGE_SDK_INT = 36;

export function getActionSheetBottomInset(liveBottom: number): number {
	const nativeReservesInset = isAndroid && Number(Platform.Version) >= TRUE_SHEET_EDGE_TO_EDGE_SDK_INT;
	if (isIOS || nativeReservesInset) {
		return 0;
	}

	// On older Android the app is not yet edge-to-edge, so this reads 0 today.
	// Proper nav-bar inset handling is deferred to the dedicated edge-to-edge PR,
	// after which this live inset becomes correct and the sheet reserves it.
	return liveBottom;
}

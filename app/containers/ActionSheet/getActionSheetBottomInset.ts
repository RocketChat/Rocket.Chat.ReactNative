import { Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

import { isAndroid, isIOS } from '../../lib/methods/helpers';

// Android API level (SDK_INT) at which edge-to-edge is enforced and TrueSheet
// auto-reserves the navigation-bar inset itself. At or above this level we let
// native handle it and return 0; below it we reserve the nav bar ourselves.
const TRUE_SHEET_EDGE_TO_EDGE_SDK_INT = 36;

export function getActionSheetBottomInset(liveBottom: number): number {
	const nativeReservesInset = isAndroid && Number(Platform.Version) >= TRUE_SHEET_EDGE_TO_EDGE_SDK_INT;
	if (isIOS || nativeReservesInset) {
		return 0;
	}

	// Live insets read 0 inside the sheet's separate window on old Android, so fall
	// back to the boot-time nav-bar height. max() also keeps us correct when live >
	// captured (e.g. rotation / nav-mode change grows the inset).
	const capturedNavBarInset = initialWindowMetrics?.insets.bottom ?? 0;
	const navBarInset = Math.max(liveBottom, capturedNavBarInset);

	return navBarInset;
}

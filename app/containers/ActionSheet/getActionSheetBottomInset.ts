import { Platform } from 'react-native';
import { initialWindowMetrics, type EdgeInsets } from 'react-native-safe-area-context';

import { isAndroid, isIOS } from '../../lib/methods/helpers';

export function getActionSheetBottomInset(liveInsets: EdgeInsets): number {
	const isNewAndroid = isAndroid && Number(Platform.Version) >= 36;
	if (isIOS || isNewAndroid) {
		return 0;
	}

	const capturedNavBarInset = initialWindowMetrics?.insets.bottom ?? 0;
	const navBarInset = Math.max(liveInsets.bottom, capturedNavBarInset);

	return navBarInset;
}

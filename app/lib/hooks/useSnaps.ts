import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isIOS, isTablet } from '../methods/helpers';

// Not sure if it's worth adding this here in the context of the actionSheet
/**
 * Return the snaps based on the size you pass (aka: Size of action sheet)
 * @param  {number} componentSize size of the component that will be rendered in the action sheet
 */
export const useSnaps = (componentSize: number): number[] | string[] => {
	const insets = useSafeAreaInsets();
	if (isIOS) {
		const fixTabletInset = isTablet ? 2 : 1;
		return [componentSize + (insets.bottom || insets.top) * fixTabletInset];
	}
	let statusHeight = 0;
	if (StatusBar.currentHeight) {
		statusHeight = StatusBar.currentHeight;
	}
	return [componentSize + statusHeight];
};

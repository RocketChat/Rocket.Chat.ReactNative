import { PixelRatio } from 'react-native';

import { ROW_HEIGHT } from '~/containers/NativeListRow/constants';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

export const useCategoryOrderRowHeight = () => {
	const { fontScale } = useResponsiveLayout();
	return PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);
};

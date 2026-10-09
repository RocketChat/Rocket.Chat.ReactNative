import { PixelRatio } from 'react-native';

import { ROW_HEIGHT } from '../constants';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

export const useNativeListRowHeight = () => {
	const { fontScale } = useResponsiveLayout();
	return PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);
};

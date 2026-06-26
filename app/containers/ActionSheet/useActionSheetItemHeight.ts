import { PixelRatio, useWindowDimensions } from 'react-native';

export const ACTION_SHEET_ITEM_HEIGHT = 48;

export const useActionSheetItemHeight = () => {
	const { fontScale } = useWindowDimensions();
	return PixelRatio.roundToNearestPixel(ACTION_SHEET_ITEM_HEIGHT * fontScale);
};

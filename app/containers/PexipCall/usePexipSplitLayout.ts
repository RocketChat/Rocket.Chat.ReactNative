import { useWindowDimensions } from 'react-native';

export const SPLIT_BAR_HEIGHT = 48;

// Portrait docks the call above the chat; landscape puts it beside the chat.
export const usePexipSplitLayout = (): {
	isLandscape: boolean;
	size: number;
} => {
	const { width, height } = useWindowDimensions();
	const isLandscape = width > height;
	const size = isLandscape ? Math.round(width / 2) : Math.round(Math.min(SPLIT_BAR_HEIGHT + (width * 9) / 16, height * 0.45));
	return { isLandscape, size };
};

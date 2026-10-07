import { useWindowDimensions } from 'react-native';

export const SPLIT_BAR_HEIGHT = 48;

export const usePexipSplitHeight = (): number => {
	const { width, height } = useWindowDimensions();
	return Math.round(Math.min(SPLIT_BAR_HEIGHT + (width * 9) / 16, height * 0.45));
};

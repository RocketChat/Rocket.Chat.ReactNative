import { useDimensions } from '@react-native-community/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Not sure if it's worth adding this here in the context of the actionSheet
/**
 * Return the snaps based on the size you pass (aka: Size of action sheet)
 * @param  {Number[]} snaps Sizes you want to pass, pass only one if you want the action sheet to start at a specific size
 */
export const useSnaps = (snaps: number[]): string[] => {
	const insets = useSafeAreaInsets();
	const { screen } = useDimensions();
	const percentage = insets.bottom + insets.top > 75 ? 110 : 100;
	return snaps.map(snap => `${((percentage * snap) / (screen.height * screen.scale)).toFixed(2)}%`);
};

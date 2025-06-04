import { useWindowDimensions } from 'react-native';

const useResponsiveFontScale = () => {
	const { fontScale } = useWindowDimensions();
	const isLargeFontScale = fontScale > 1.3;

	return {
		isLargeFontScale
	};
};

export default useResponsiveFontScale;

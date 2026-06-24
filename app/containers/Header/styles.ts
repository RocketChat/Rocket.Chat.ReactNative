import { StyleSheet } from 'react-native-unistyles';

import { isTablet } from '../../lib/methods/helpers';

export const styles = StyleSheet.create((_theme, rt) => ({
	headerBackButton: {
		margin: 0,
		marginRight: isTablet ? 5 : -5
	},
	// 32.5 sizes the placeholder to match the header buttons on both platforms
	headerPlaceholderIOS: {
		width: 32.5 * rt.fontScale,
		height: 32.5 * rt.fontScale
	},
	headerPlaceholderAndroid: {
		height: 32.5 * rt.fontScale
	}
}));

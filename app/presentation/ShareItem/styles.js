import { StyleSheet, PixelRatio } from 'react-native';

export const ROW_HEIGHT = 56 * PixelRatio.getFontScale();

export default StyleSheet.create({
	content: {
		height: 40,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		marginLeft: 14,
		paddingRight: 28
	},
	name: {
		fontSize: 17,
		lineHeight: 20
	},
	center: {
		flex: 1,
		height: '100%',
		width: '100%',
		justifyContent: 'center'
	},
	avatar: {
		marginRight: 10
	}
});

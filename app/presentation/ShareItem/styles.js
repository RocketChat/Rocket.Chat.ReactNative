import { StyleSheet, PixelRatio } from 'react-native';

export const ROW_HEIGHT = 56 * PixelRatio.getFontScale();

export default StyleSheet.create({
	content: {
		height: 40,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		marginLeft: 14,
		paddingRight: 16
	},
	name: {
		fontSize: 17,
		lineHeight: 20,
		width: '80%'
	},
	center: {
		flex: 1,
		height: '100%',
		width: '100%',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row'
	},
	avatar: {
		marginRight: 10
	}
});

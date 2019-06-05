import { StyleSheet, PixelRatio } from 'react-native';

import {
	COLOR_SEPARATOR
} from '../../constants/colors';

export const ROW_HEIGHT = 56 * PixelRatio.getFontScale();

export default StyleSheet.create({
	content: {
		height: 40,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		marginLeft: 14,
		paddingRight: 28,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR
	},
	name: {
		flex: 1,
		fontSize: 17,
		lineHeight: 20
	},
	avatar: {
		marginRight: 10
	}
});

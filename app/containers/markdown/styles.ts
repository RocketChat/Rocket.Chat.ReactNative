import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

export default StyleSheet.create({
	blocks: {
		gap: 2
	},
	lineBreak: {
		height: 8
	},
	plainText: {
		fontSize: 16,
		flexShrink: 1,
		lineHeight: 22
	},
	text: {
		lineHeight: 22,
		fontSize: 16,
		...sharedStyles.textRegular
	},
	textBig: {
		lineHeight: 43,
		fontSize: 30,
		...sharedStyles.textRegular
	}
});

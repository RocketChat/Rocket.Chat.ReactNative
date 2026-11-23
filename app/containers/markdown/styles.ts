import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

export default StyleSheet.create({
	blocks: {
		gap: 2
	},
	lineBreak: {
		height: 8
	},
	text: {
		lineHeight: 22,
		fontSize: 16,
		...sharedStyles.textRegular
	}
});

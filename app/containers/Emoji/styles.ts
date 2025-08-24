import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const EMOJI_BUTTON_SIZE = 44;
export const EMOJI_SIZE = EMOJI_BUTTON_SIZE - 16;

export default StyleSheet.create({
	emoji: {
		...sharedStyles.textAlignCenter,
		textAlignVertical: 'center',
		fontSize: EMOJI_SIZE,
		backgroundColor: 'transparent',
		color: '#ffffff'
	},
	customEmoji: {
		height: EMOJI_SIZE,
		width: EMOJI_SIZE
	}
});

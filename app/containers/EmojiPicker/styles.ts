import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const EMOJI_BUTTON_SIZE = 44;
export const EMOJI_SIZE = EMOJI_BUTTON_SIZE - 16;

export default StyleSheet.create({
	container: {
		flex: 1
	},
	tabsContainer: {
		flexDirection: 'row',
		width: '100%'
	},
	tab: {
		flexDirection: 'column',
		flex: 1,
		alignItems: 'center'
	},
	tabEmoji: {
		paddingVertical: 4
	},
	tabLine: {
		width: '100%',
		height: 2
	},
	categoryContainer: {
		flex: 1,
		alignItems: 'flex-start'
	},
	categoryInner: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		flex: 1
	},
	categoryEmoji: {
		...sharedStyles.textAlignCenter,
		textAlignVertical: 'center',
		fontSize: EMOJI_SIZE,
		backgroundColor: 'transparent',
		color: '#ffffff'
	},
	customCategoryEmoji: {
		height: EMOJI_SIZE,
		width: EMOJI_SIZE
	},
	emojiButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: EMOJI_BUTTON_SIZE,
		width: EMOJI_BUTTON_SIZE
	},
	footerContainer: {
		height: EMOJI_BUTTON_SIZE,
		paddingHorizontal: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTopWidth: 1
	},
	footerButtonsContainer: {
		height: EMOJI_BUTTON_SIZE,
		width: EMOJI_BUTTON_SIZE,
		justifyContent: 'center',
		alignItems: 'center'
	},
	emojiPickerContainer: { flex: 1 },
	input: {
		height: 32,
		borderWidth: 0,
		paddingVertical: 0,
		borderRadius: 4
	},
	textInputContainer: {
		marginBottom: 0
	}
});

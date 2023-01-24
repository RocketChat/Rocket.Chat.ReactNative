import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const EMOJI_BUTTON_SIZE = 44;
export const EMOJI_SIZE = EMOJI_BUTTON_SIZE - 16;

export default StyleSheet.create({
	container: {
		flex: 1
	},
	tabsContainer: {
		height: EMOJI_BUTTON_SIZE,
		flexDirection: 'row'
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		width: EMOJI_BUTTON_SIZE
	},
	tabEmoji: {
		fontSize: 20,
		color: 'black'
	},
	activeTabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		bottom: 0
	},
	tabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		bottom: 0
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
	emojiPickerContainer: { flex: 1 }
});

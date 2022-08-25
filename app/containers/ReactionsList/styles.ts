import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const MIN_TAB_WIDTH = 70;

export default StyleSheet.create({
	reactionsListContainer: {
		height: '100%',
		width: '100%'
	},
	allReactionsContainer: {
		height: '100%',
		width: '100%',
		paddingTop: 5
	},
	tabBarItem: {
		paddingHorizontal: 10,
		paddingBottom: 10,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row'
	},
	listContainer: {
		marginHorizontal: 12,
		marginVertical: 8,
		paddingBottom: 30
	},
	reactionCount: {
		marginLeft: 5
	},
	emojiNameContainer: {
		marginVertical: 8
	},
	emojiName: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	listItemContainer: {
		marginVertical: 6,
		flexDirection: 'row',
		alignItems: 'center'
	},
	textContainer: {
		flex: 1,
		marginLeft: 8,
		justifyContent: 'center'
	},
	usernameText: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	standardEmojiStyle: {
		fontSize: 20,
		width: 24,
		height: 24,
		textAlign: 'center',
		color: '#fff'
	},
	customEmojiStyle: {
		width: 24,
		height: 24
	},
	allTabItem: {
		height: 24,
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	allTabStandardEmojiStyle: {
		fontSize: 30,
		width: 36,
		textAlign: 'center',
		color: '#fff'
	},
	allTabCustomEmojiStyle: {
		width: 36,
		height: 36
	},
	allListItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	allListNPeopleReacted: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	allListWhoReacted: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

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
	usersListContainer: {
		marginHorizontal: 12,
		marginVertical: 8
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
	userItemContainer: {
		marginVertical: 6,
		flexDirection: 'row'
	},
	textContainer: {
		marginHorizontal: 10,
		justifyContent: 'center'
	},
	usernameText: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	standardEmojiStyle: {
		fontSize: 20,
		color: '#fff'
	},
	customEmojiStyle: {
		width: 25,
		height: 25
	},
	allTabStandardEmojiStyle: {
		fontSize: 28,
		color: '#fff'
	},
	allTabCustomEmojiStyle: {
		width: 32,
		height: 32
	},
	allListItemContainer: {
		paddingHorizontal: 10,
		marginVertical: 5,
		flexDirection: 'row',
		alignItems: 'center'
	},
	peopleReactedContainer: {
		marginHorizontal: 20
	}
});

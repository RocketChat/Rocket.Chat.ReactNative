import { StyleSheet, Platform } from 'react-native';

const MENTION_HEIGHT = 50;

export default StyleSheet.create({
	textBox: {
		backgroundColor: '#fff',
		flex: 0,
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#D8D8D8',
		zIndex: 2
	},
	safeAreaView: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0
	},
	textBoxInput: {
		textAlignVertical: 'center',
		maxHeight: 120,
		flexGrow: 1,
		width: 1,
		paddingTop: 15,
		paddingBottom: 15,
		paddingLeft: 0,
		paddingRight: 0
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButtons: {
		color: '#2F343D',
		fontSize: 20,
		textAlign: 'center',
		padding: 15,
		paddingHorizontal: 21,
		flex: 0
	},
	actionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		alignContent: 'center'
	},
	actionContent: {
		borderBottomWidth: 1,
		borderBottomColor: '#ECECEC',

		borderTopWidth: 1,
		borderTopColor: '#ECECEC',

		backgroundColor: '#F7F8FA'
	},
	actionTitle: {
		flex: 1,
		fontSize: 17,
		padding: 14,
		textAlign: 'right',
		borderBottomWidth: 1,
		borderBottomColor: '#ECECEC',
		color: '#2F343D'
	},
	mentionList: {
		maxHeight: MENTION_HEIGHT * 4,
		borderTopColor: '#ECECEC',
		borderTopWidth: 1,
		paddingHorizontal: 5,
		backgroundColor: '#fff'
	},
	mentionItem: {
		height: MENTION_HEIGHT,
		backgroundColor: '#F7F8FA',
		borderBottomWidth: 1,
		borderBottomColor: '#ECECEC',
		flexDirection: 'row',
		alignItems: 'center'
	},
	emojiContainer: {
		height: 200,
		borderTopColor: '#ECECEC',
		borderTopWidth: 1,
		backgroundColor: '#fff'
	},
	mentionItemCustomEmoji: {
		margin: 8,
		width: 30,
		height: 30
	},
	mentionItemEmoji: {
		width: 46,
		height: 36,
		fontSize: Platform.OS === 'ios' ? 30 : 25,
		textAlign: 'center'
	},
	fixedMentionAvatar: {
		fontWeight: 'bold',
		textAlign: 'center',
		width: 46
	},
	emojiKeyboardContainer: {
		flex: 1,
		borderTopColor: '#ECECEC',
		borderTopWidth: 1
	}
});

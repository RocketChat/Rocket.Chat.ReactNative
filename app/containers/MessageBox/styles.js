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
	composer: {
		backgroundColor: '#fff',
		flexDirection: 'column',
		borderTopColor: '#e1e5e8',
		borderTopWidth: 1
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		backgroundColor: '#fff'
	},
	textBoxInput: {
		textAlignVertical: 'center',
		maxHeight: 242,
		flexGrow: 1,
		width: 1,
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		paddingTop: 12,
		paddingBottom: 12,
		paddingLeft: 0,
		paddingRight: 0,
		fontSize: 17,
		letterSpacing: 0,
		color: '#2f343d'
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 60,
		height: 56
	},
	mentionList: {
		maxHeight: MENTION_HEIGHT * 4
	},
	mentionItem: {
		height: MENTION_HEIGHT,
		backgroundColor: '#F7F8FA',
		borderTopWidth: 1,
		borderTopColor: '#ECECEC',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 5
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
	},
	iphoneXArea: {
		height: 50,
		backgroundColor: '#fff',
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0
	}
});

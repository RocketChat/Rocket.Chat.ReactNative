import { StyleSheet } from 'react-native';

const MENTION_HEIGHT = 50;

export default StyleSheet.create({
	textBox: {
		backgroundColor: '#fff',
		flex: 0,
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#D8D8D8',
		paddingHorizontal: 15,
		paddingVertical: 15,
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
		paddingVertical: 0,
		paddingHorizontal: 10,
		textAlignVertical: 'top',
		maxHeight: 120,
		flexGrow: 1,
		width: 1,
		paddingTop: 0,
		paddingBottom: 0
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButtons: {
		color: '#2F343D',
		fontSize: 20,
		textAlign: 'center',
		paddingHorizontal: 5,
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
	}
});

import { StyleSheet } from 'react-native';


export default StyleSheet.create({
	textBox: {
		backgroundColor: '#fff',
		flex: 0,
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#D8D8D8',
		paddingHorizontal: 15,
		paddingVertical: 15
	},
	safeAreaView: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'white',
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
	}
});

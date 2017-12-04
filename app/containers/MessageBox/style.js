import { StyleSheet } from 'react-native';


export default StyleSheet.create({
	textBox: {
		backgroundColor: '#fff',
		flex: 0,
		alignItems: 'stretch'
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
		minHeight: 40,
		maxHeight: 120,
		flexGrow: 1,
		width: 1
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButtons: {
		color: '#2F343D',
		fontSize: 25,
		paddingHorizontal: 15,
		width: 55,
		flex: 0,
		textAlign: 'center'
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

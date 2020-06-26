import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	input: {
		textAlignVertical: 'top',
		padding: 15,
		paddingTop: 5,
		fontSize: 17,
		letterSpacing: 0,
		...sharedStyles.textRegular,
		flex: 1
	},
	closeModal: {
		alignSelf: 'flex-end',
		margin: 10,
		marginBottom: 0
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	rightButtons: {
		flexDirection: 'row'
	}
});
